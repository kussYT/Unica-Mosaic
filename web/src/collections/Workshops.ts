import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '../access/roles'
import { publishedOrStaff } from '../access/published'

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const guardPublication: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data
  const price = data.priceCents !== undefined ? data.priceCents : originalDoc?.priceCents
  const deposit = data.depositCents !== undefined ? data.depositCents : originalDoc?.depositCents
  const status = data._status !== undefined ? data._status : originalDoc?._status
  if (typeof price === 'number' && price < 0) {
    throw new Error('Le tarif total ne peut pas être négatif.')
  }
  if (typeof deposit === 'number' && deposit < 0) {
    throw new Error('L’acompte ne peut pas être négatif.')
  }
  if (typeof deposit === 'number' && typeof price !== 'number') {
    throw new Error('Indiquez le tarif total avant l’acompte.')
  }
  if (typeof deposit === 'number' && typeof price === 'number' && deposit > price) {
    throw new Error('L’acompte ne peut pas dépasser le tarif total.')
  }
  if (status === 'published' && (typeof price !== 'number' || typeof deposit !== 'number')) {
    throw new Error('Le tarif total et l’acompte doivent être confirmés avant publication.')
  }
  return data
}

export const Workshops: CollectionConfig = {
  slug: 'workshops',
  labels: { singular: 'Atelier', plural: 'Ateliers' },
  admin: { useAsTitle: 'title', group: 'Catalogue', defaultColumns: ['title', '_status', 'updatedAt'] },
  versions: { drafts: true },
  access: {
    create: isStaff,
    delete: isAdmin,
    read: publishedOrStaff,
    update: isStaff,
  },
  hooks: { beforeChange: [guardPublication] },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Adresse de la page',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Identifiant de l’URL, par exemple recolle-toi-meuf. Laisser vide pour le remplir à partir du titre.' },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (typeof value === 'string' && value.trim()) return slugify(value)
            if (typeof siblingData?.title === 'string') return slugify(siblingData.title)
            return value
          },
        ],
      },
    },
    { name: 'label', label: 'Surtitre', type: 'text' },
    { name: 'summary', label: 'Description courte', type: 'textarea', required: true },
    { name: 'description', label: 'Description longue', type: 'textarea', required: true },
    {
      name: 'tone',
      label: 'Couleur de la carte',
      type: 'select',
      defaultValue: 'pink',
      options: [
        { label: 'Rose', value: 'pink' },
        { label: 'Rose clair', value: 'blush' },
        { label: 'Violet', value: 'plum' },
        { label: 'Jaune', value: 'cream' },
      ],
    },
    {
      name: 'gallery',
      label: 'Photos et vidéos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'priceCents',
      label: 'Tarif total (centimes)',
      type: 'number',
      min: 0,
      admin: { description: 'Laisser vide tant que le tarif n’est pas confirmé. Le montant est en centimes : 100 correspond à 1,00 €.' },
    },
    {
      name: 'depositCents',
      label: 'Acompte (centimes)',
      type: 'number',
      min: 0,
      admin: { description: 'Montant compris entre zéro et le tarif total. Laisser vide tant qu’il n’est pas confirmé.' },
      validate: (value: number | null | undefined, { siblingData }: { siblingData: { priceCents?: number | null } }) => {
        if (value == null) return true
        if (value < 0) return 'L’acompte ne peut pas être négatif.'
        const price = siblingData.priceCents
        if (typeof price === 'number' && value > price) return 'L’acompte ne peut pas dépasser le tarif total.'
        if (typeof price !== 'number') return 'Indiquez le tarif total avant l’acompte.'
        return true
      },
    },
    {
      name: 'durationMinutes',
      label: 'Durée (minutes)',
      type: 'number',
      min: 1,
      admin: { description: 'Laisser vide tant que la durée n’est pas confirmée.' },
    },
    { name: 'practicalInfo', label: 'Informations pratiques', type: 'textarea' },
  ],
}
