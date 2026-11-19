import type { CollectionConfig } from 'payload'
import { publishedOrStaff } from '../access/published'
import { isAdmin, isStaff } from '../access/roles'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Kit', plural: 'Kits Mosaic Kids' },
  admin: { useAsTitle: 'title', group: 'Catalogue', defaultColumns: ['title', 'priceCents', 'stock', '_status'] },
  versions: { drafts: true },
  access: { read: publishedOrStaff, create: isStaff, update: isStaff, delete: isAdmin },
  fields: [
    { name: 'title', label: 'Nom du kit', type: 'text', required: true },
    { name: 'slug', label: 'Adresse du produit', type: 'text', required: true, unique: true,
      validate: (value: unknown) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || 'Utilisez des lettres minuscules, chiffres et tirets.' },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'contents', label: 'Contenu du kit', type: 'textarea', required: true },
    { name: 'recommendedAge', label: 'Âge conseillé', type: 'text' },
    { name: 'photos', label: 'Photos', type: 'upload', relationTo: 'media', hasMany: true, required: true,
      filterOptions: { mimeType: { contains: 'image/' } } },
    { name: 'priceCents', label: 'Prix en centimes', type: 'number', required: true, min: 1,
      validate: (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 || 'Indiquez un prix entier en centimes.' },
    { name: 'stock', label: 'Stock', type: 'number', required: true, min: 0, defaultValue: 0,
      validate: (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 || 'Indiquez un nombre entier positif ou nul.' },
  ],
}
