import { getPayload } from 'payload'

import config from '../src/payload.config.ts'

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to create an admin account when NODE_ENV is production')
}

const databaseUrl = process.env.DATABASE_URL || ''
if (!/@(127\.0\.0\.1|localhost):5433\/unica_mosaic_local(\?|$)/.test(databaseUrl)) {
  throw new Error('Refusing to seed: DATABASE_URL must target unica_mosaic_local on port 5433')
}

const email = process.env.PAYLOAD_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD
if (!email || !password || password === 'change-me') {
  throw new Error('PAYLOAD_ADMIN_EMAIL and PAYLOAD_ADMIN_PASSWORD are required')
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
  console.log(`Admin created: ${email}`)
} else {
  console.log(`Admin already present: ${email}`)
}

await payload.destroy()
process.exit(0)
