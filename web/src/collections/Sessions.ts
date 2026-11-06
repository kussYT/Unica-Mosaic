import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { publishedOrStaff } from '../access/published'
import { isAdmin, isStaff } from '../access/roles'

const isConfirmedCapacity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1

const guardSession: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data
  const startsAt = data.startsAt !== undefined ? data.startsAt : originalDoc?.startsAt
  const endsAt = data.endsAt !== undefined ? data.endsAt : originalDoc?.endsAt
  const workshop = data.workshop !== undefined ? data.workshop : originalDoc?.workshop
  const capacity = data.capacity !== undefined ? data.capacity : originalDoc?.capacity
  const status = data._status !== undefined ? data._status : originalDoc?._status
  if (startsAt && endsAt && new Date(String(endsAt)).getTime() <= new Date(String(startsAt)).getTime()) {
    throw new Error('La fin de la session doit être postérieure au début.')
  }
  if (capacity != null && !isConfirmedCapacity(capacity)) {
    throw new Error('Le nombre de participants doit être un entier supérieur à zéro.')
  }
  if (status === 'published') {
    if (!startsAt || !endsAt || !workshop) {
      throw new Error('Une session publiée doit avoir un atelier, un début et une fin.')
    }
    if (!isConfirmedCapacity(capacity)) {
      throw new Error('Une session publiée doit indiquer un nombre entier de participants.')
    }
  }
  return data
}

export const Sessions: CollectionConfig = {
  slug: 'sessions',
  labels: { singular: 'Session', plural: 'Sessions' },
  admin: {
    useAsTitle: 'startsAt',
    group: 'Catalogue',
    defaultColumns: ['workshop', 'startsAt', 'state', '_status'],
  },
  versions: { drafts: true },
  access: {
    create: isStaff,
    delete: isAdmin,
    read: publishedOrStaff,
    update: isStaff,
  },
  hooks: { beforeChange: [guardSession] },
  fields: [
    {
      name: 'workshop',
      label: 'Atelier',
      type: 'relationship',
      relationTo: 'workshops',
      required: true,
    },
    {
      name: 'startsAt',
      label: 'Début',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'endsAt',
      label: 'Fin',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
      validate: (value: Date | string | null | undefined, { siblingData }: { siblingData: { startsAt?: string } }) => {
        if (!value || !siblingData.startsAt) return true
        if (new Date(String(value)).getTime() <= new Date(siblingData.startsAt).getTime()) {
          return 'La fin doit être postérieure au début.'
        }
        return true
      },
    },
    {
      name: 'capacity',
      label: 'Nombre maximum de participants',
      type: 'number',
      min: 1,
      admin: { description: 'Nombre entier, au moins 1. Obligatoire pour publier. Laisser vide dans un brouillon tant que la capacité n’est pas confirmée. Ce chiffre n’ouvre pas de réservation.' },
      validate: (value: number | null | undefined) => {
        if (value == null) return true
        if (!Number.isInteger(value) || value < 1) return 'Indiquez un nombre entier de participants, au moins 1.'
        return true
      },
    },
    { name: 'place', label: 'Lieu', type: 'text' },
    {
      name: 'state',
      label: 'État de la session',
      type: 'select',
      required: true,
      defaultValue: 'scheduled',
      options: [
        { label: 'Programmée', value: 'scheduled' },
        { label: 'Complète', value: 'full' },
        { label: 'Annulée', value: 'cancelled' },
      ],
    },
  ],
}
