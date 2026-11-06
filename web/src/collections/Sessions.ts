import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { publishedOrStaff } from '../access/published'
import { isAdmin, isStaff } from '../access/roles'

const guardSession: CollectionBeforeChangeHook = ({ data }) => {
  if (!data) return data
  if (data.startsAt && data.endsAt && new Date(data.endsAt).getTime() <= new Date(data.startsAt).getTime()) {
    throw new Error('La fin de la session doit être postérieure au début.')
  }
  if (data._status === 'published' && (!data.startsAt || !data.endsAt || !data.workshop)) {
    throw new Error('Une session publiée doit avoir un atelier, un début et une fin.')
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
      admin: { description: 'Laisser vide tant que la capacité n’est pas confirmée. Ce chiffre n’ouvre pas de réservation.' },
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
