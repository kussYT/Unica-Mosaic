import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { databaseTargetError } from '../src/lib/database-target.ts'

if (process.env.UNICA_RUNTIME !== 'preview' || process.env.NODE_ENV !== 'production') {
  throw new Error('Ce compte ne peut être créé qu’en préproduction.')
}

const databaseFailure = databaseTargetError(
  process.env.DATABASE_URL || '',
  process.env.UNICA_RUNTIME,
  process.env.NODE_ENV,
)
if (databaseFailure) throw new Error(databaseFailure)

const email = process.env.PAYLOAD_ADMIN_EMAIL || ''
const password = process.env.PAYLOAD_ADMIN_PASSWORD || ''
if (email === 'admin@unica.local') {
  throw new Error('Le compte de développement local est refusé en préproduction.')
}
if (!email.endsWith('@unica-preview.versatech-dev.fr') || password.length < 16) {
  throw new Error('Identifiant de préproduction incomplet.')
}

const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
  overrideAccess: true,
})

if (existing.totalDocs === 0) {
  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password, role: 'admin' },
  })
  console.log('Compte administrateur de préproduction créé')
} else {
  console.log('Compte administrateur de préproduction déjà présent')
}

await payload.destroy()
process.exit(0)
