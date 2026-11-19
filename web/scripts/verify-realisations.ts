import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import type { User } from '../src/payload-types.ts'

const db = new URL(process.env.DATABASE_URL || 'postgres://invalid')
assert.ok(['localhost', '127.0.0.1'].includes(db.hostname) && db.port === '5433' && db.pathname === '/unica_mosaic_local')
const payload = await getPayload({ config })
const editor = { id: -1, collection: 'users', role: 'editor' } as User
let createdId: number | undefined
try {
  const publicRead = () => payload.find({ collection: 'realisations', overrideAccess: false, pagination: false })
  const sample = (await publicRead()).docs
  assert.equal(sample.length, 11)
  const first = sample[0].photos[0]
  const photo = typeof first === 'number' ? first : first.id
  const data = { title: 'Contrôle temporaire galerie', photos: [photo], displayOrder: 0 }
  await assert.rejects(payload.create({ collection: 'realisations', overrideAccess: false, data }))
  const draft = await payload.create({
    collection: 'realisations', user: editor, overrideAccess: false, draft: true, data: { ...data, _status: 'draft' },
  })
  createdId = draft.id
  assert.equal((await publicRead()).docs.some((item) => item.id === draft.id), false)
  await payload.update({
    collection: 'realisations', user: editor, overrideAccess: false, id: draft.id, data: { _status: 'published' },
  })
  assert.equal((await publicRead()).docs[0].id, draft.id)
  await assert.rejects(payload.delete({ collection: 'realisations', user: editor, overrideAccess: false, id: draft.id }))
  await payload.update({
    collection: 'realisations', user: editor, overrideAccess: false, id: draft.id, data: { _status: 'draft' },
  })
  assert.equal((await publicRead()).docs.some((item) => item.id === draft.id), false)
  console.log('Galerie : 11 œuvres, accès public, brouillon, publication, ordre et droits éditeur vérifiés.')
} finally {
  if (createdId !== undefined) await payload.delete({ collection: 'realisations', id: createdId })
  await payload.destroy()
}
process.exit(0)
