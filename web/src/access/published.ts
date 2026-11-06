import type { Access } from 'payload'

import { isStaff } from './roles'

export const publishedOrStaff: Access = ({ req }) => {
  if (isStaff({ req })) return true
  return { _status: { equals: 'published' } }
}
