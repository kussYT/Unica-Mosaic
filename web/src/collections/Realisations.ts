import type { CollectionConfig } from 'payload'

import { publishedOrStaff } from '../access/published'
import { isAdmin, isStaff } from '../access/roles'

export const Realisations: CollectionConfig = {
  slug: 'realisations',
  labels: { singular: 'Réalisation', plural: 'Réalisations' },
  admin: { useAsTitle: 'title', group: 'Catalogue', defaultColumns: ['title', 'displayOrder', '_status'] },
  defaultSort: 'displayOrder',
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: isStaff, update: isStaff, delete: isAdmin },
  fields: [
    { name: 'title', label: 'Titre', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'displayOrder', label: 'Ordre d’affichage', type: 'number', min: 0, defaultValue: 100, required: true },
    {
      name: 'photos',
      label: 'Photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      filterOptions: { mimeType: { contains: 'image/' } },
    },
  ],
}
