import type { CollectionConfig } from 'payload'

import { isAdmin, userRole } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Utilisateur', plural: 'Utilisateurs' },
  admin: { useAsTitle: 'email' },
  auth: true,
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) => {
      if (userRole(req.user) === 'admin') return true
      if (req.user) return { id: { equals: req.user.id } }
      return false
    },
    update: ({ req }) => {
      if (!req.user) return false
      if (userRole(req.user) === 'admin') return true
      return { id: { equals: req.user.id } }
    },
  },
  fields: [
    {
      name: 'role',
      label: 'Rôle',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Éditeur', value: 'editor' },
      ],
      access: {
        update: ({ req }) => userRole(req.user) === 'admin',
      },
    },
  ],
}
