import type { Access } from 'payload'

type Role = 'admin' | 'editor'

export const userRole = (user: unknown): Role | null => {
  if (!user || typeof user !== 'object' || !('role' in user)) return null
  const role = user.role
  return role === 'admin' || role === 'editor' ? role : null
}

export const isAdmin: Access = ({ req }) => userRole(req.user) === 'admin'

export const isStaff: Access = ({ req }) => userRole(req.user) !== null
