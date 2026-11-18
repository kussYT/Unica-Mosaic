import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

import { isAdmin, isStaff } from '../access/roles'
import { assertCanOccupy, HOLD_MINUTES } from '../lib/availability'

const money = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)

const sessionRef = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return null
}

const occupiesSeats = (status: unknown, heldUntil: unknown) => {
  if (status === 'confirmed') return true
  if (status === 'held') {
    if (!heldUntil) return false
    return new Date(String(heldUntil)).getTime() > Date.now()
  }
  return false
}

const normalizeMoney: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data
  const total = money(data.totalCents !== undefined ? data.totalCents : originalDoc?.totalCents) ?? 0
  const deposit = money(data.depositCents !== undefined ? data.depositCents : originalDoc?.depositCents) ?? 0
  const paid = money(data.paidCents !== undefined ? data.paidCents : originalDoc?.paidCents) ?? 0
  if (total < 0 || deposit < 0 || paid < 0) {
    throw new Error('Les montants ne peuvent pas être négatifs.')
  }
  if (deposit > total) {
    throw new Error('L’acompte ne peut pas dépasser le montant total.')
  }
  if (paid > total) {
    throw new Error('Le montant payé ne peut pas dépasser le montant total.')
  }
  data.balanceCents = Math.max(0, total - paid)
  return data
}

const guardReservation: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req, context }) => {
  if (!data || context?.skipCapacityGuard) return data

  const sessionId = sessionRef(data.session !== undefined ? data.session : originalDoc?.session)
  const participants =
    data.participants !== undefined ? data.participants : originalDoc?.participants
  const status = data.status !== undefined ? data.status : originalDoc?.status
  const heldUntil = data.heldUntil !== undefined ? data.heldUntil : originalDoc?.heldUntil
  const origin = data.origin !== undefined ? data.origin : originalDoc?.origin || 'manual'

  if (!sessionId) throw new Error('Une réservation doit être liée à une session.')
  if (!Number.isInteger(participants) || Number(participants) < 1) {
    throw new Error('Le nombre de participants doit être un entier supérieur à zéro.')
  }

  if (operation === 'create' && !data.origin) data.origin = 'manual'

  if (status === 'held') {
    if (!data.heldUntil && !originalDoc?.heldUntil) {
      data.heldUntil = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString()
    }
  }

  if (status === 'confirmed') {
    if (!originalDoc?.confirmedAt && !data.confirmedAt) {
      data.confirmedAt = new Date().toISOString()
    }
    if (originalDoc?.status === 'confirmed' && data.status === 'confirmed' && operation === 'update') {
      // déjà confirmée : pas de double confirmation métier
    }
  }

  if (status === 'cancelled' && !data.cancelledAt && !originalDoc?.cancelledAt) {
    data.cancelledAt = new Date().toISOString()
  }

  if (status === 'expired' && !data.expiredAt && !originalDoc?.expiredAt) {
    data.expiredAt = new Date().toISOString()
  }

  if (origin === 'manual' && operation === 'create' && !data.status) {
    data.status = 'confirmed'
  }
  if (operation === 'create') {
    if (data.paymentMode == null) data.paymentMode = origin === 'online' ? undefined : 'none'
    if (data.paymentStatus == null) data.paymentStatus = origin === 'online' ? 'pending' : 'unpaid'
  }

  const nextStatus = data.status !== undefined ? data.status : status
  const nextHeldUntil = data.heldUntil !== undefined ? data.heldUntil : heldUntil
  const willOccupy = occupiesSeats(nextStatus, nextHeldUntil)

  if (willOccupy) {
    await assertCanOccupy(
      req.payload,
      sessionId,
      Number(participants),
      operation === 'update' ? originalDoc?.id : undefined,
    )
  }

  if (
    operation === 'update' &&
    originalDoc?.status === 'confirmed' &&
    data.status === 'confirmed' &&
    data.confirmedAt &&
    originalDoc.confirmedAt &&
    data.confirmedAt !== originalDoc.confirmedAt
  ) {
    throw new Error('Cette réservation est déjà confirmée.')
  }

  return data
}

export const Reservations: CollectionConfig = {
  slug: 'reservations',
  labels: { singular: 'Réservation', plural: 'Réservations' },
  admin: {
    useAsTitle: 'lastName',
    group: 'Réservations',
    defaultColumns: [
      'lastName',
      'firstName',
      'session',
      'participants',
      'status',
      'paymentStatus',
      'paidCents',
      'balanceCents',
    ],
    description:
      'Inscriptions manuelles et réservations en ligne. Les places restantes se calculent depuis les confirmées et les retenues actives. Un montant payé n’est enregistré qu’après encaissement réel.',
  },
  access: {
    create: isStaff,
    delete: isAdmin,
    read: isStaff,
    update: isStaff,
  },
  hooks: {
    beforeValidate: [normalizeMoney],
    beforeChange: [guardReservation],
  },
  fields: [
    {
      name: 'session',
      label: 'Session',
      type: 'relationship',
      relationTo: 'sessions',
      required: true,
      index: true,
      admin: {
        description: 'Session concernée. Filtrer ensuite par atelier via la session.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'firstName', label: 'Prénom', type: 'text', required: true },
        { name: 'lastName', label: 'Nom', type: 'text', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', label: 'E-mail', type: 'email', required: true },
        { name: 'phone', label: 'Téléphone', type: 'text' },
      ],
    },
    {
      name: 'participants',
      label: 'Nombre de participants',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
      admin: { description: 'Entier ≥ 1. Compte dans les places occupées si la réservation est confirmée ou retenue.' },
      validate: (value: number | null | undefined) => {
        if (!Number.isInteger(value) || Number(value) < 1) return 'Indiquez un nombre entier de participants, au moins 1.'
        return true
      },
    },
    {
      name: 'status',
      label: 'Statut',
      type: 'select',
      required: true,
      defaultValue: 'confirmed',
      index: true,
      options: [
        { label: 'En attente', value: 'pending' },
        { label: 'Retenue temporaire', value: 'held' },
        { label: 'Confirmée', value: 'confirmed' },
        { label: 'Expirée', value: 'expired' },
        { label: 'Annulée', value: 'cancelled' },
      ],
      admin: {
        description: 'Seules les confirmées et les retenues non expirées occupent des places.',
      },
    },
    {
      name: 'origin',
      label: 'Origine',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Inscription manuelle', value: 'manual' },
        { label: 'Réservation en ligne', value: 'online' },
      ],
    },
    {
      name: 'paymentMode',
      label: 'Mode de paiement choisi',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Aucun (manuel)', value: 'none' },
        { label: 'Acompte en ligne', value: 'deposit' },
        { label: 'Intégralité en ligne', value: 'full' },
      ],
      admin: { description: 'Choix du client pour le parcours Stripe. Les inscriptions manuelles restent sur « Aucun ».' },
    },
    {
      name: 'paymentStatus',
      label: 'Statut de paiement',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      index: true,
      options: [
        { label: 'Non payé', value: 'unpaid' },
        { label: 'Paiement en cours', value: 'pending' },
        { label: 'Payé en ligne', value: 'paid' },
        { label: 'Échec / abandon', value: 'failed' },
        { label: 'Exception à réconcilier', value: 'exception' },
      ],
      admin: {
        description: 'Ne passer à « Payé en ligne » qu’après confirmation Stripe réelle. Jamais pour une inscription manuelle sans encaissement documenté.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'totalCents',
          label: 'Montant total (centimes)',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { description: 'À encaisser. Ne signifie pas « payé ».' },
        },
        {
          name: 'depositCents',
          label: 'Acompte demandé (centimes)',
          type: 'number',
          min: 0,
          defaultValue: 0,
        },
        {
          name: 'paidCents',
          label: 'Montant payé (centimes)',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            description: 'Uniquement ce qui a réellement été encaissé. Laisser à 0 tant que ce n’est pas confirmé.',
          },
        },
        {
          name: 'balanceCents',
          label: 'Solde restant (centimes)',
          type: 'number',
          min: 0,
          admin: {
            readOnly: true,
            description: 'Calculé : total − payé. Montant encore à encaisser.',
          },
        },
      ],
    },
    {
      name: 'heldUntil',
      label: 'Expiration de la retenue',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_, siblingData) => siblingData?.status === 'held',
        description: `Retenue temporaire (défaut ${HOLD_MINUTES} min pour le futur parcours en ligne).`,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'confirmedAt',
          label: 'Confirmée le',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true },
        },
        {
          name: 'cancelledAt',
          label: 'Annulée le',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true },
        },
        {
          name: 'expiredAt',
          label: 'Expirée le',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true },
        },
      ],
    },
    {
      name: 'rescheduleTo',
      label: 'Report prévu vers',
      type: 'relationship',
      relationTo: 'sessions',
      admin: {
        description: 'Préparation d’un report vers une autre session. Ne déplace pas automatiquement les places.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'stripeCheckoutSessionId',
          label: 'Stripe Checkout Session',
          type: 'text',
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'stripePaymentIntentId',
          label: 'Stripe PaymentIntent',
          type: 'text',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'confirmationEmailSentAt',
      label: 'E-mail de confirmation tenté le',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true },
    },
    {
      name: 'adminNote',
      label: 'Note interne',
      type: 'textarea',
      admin: { description: 'Note pour Marie (report, paiement, contact, exception Stripe…).' },
    },
  ],
}
