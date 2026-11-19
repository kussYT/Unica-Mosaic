import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

const db = new URL(process.env.DATABASE_URL || 'postgres://invalid')
assert.ok(['127.0.0.1', 'localhost'].includes(db.hostname) &&
  db.port === '5433' && db.pathname === '/unica_mosaic_local' && process.env.UNICA_RUNTIME !== 'preview')
const payload = await getPayload({ config })
const slug = 'controle-kit-' + Date.now()
const base = 'http://127.0.0.1:3000'
let id: number | undefined
try {
  const media = await payload.find({ collection: 'media', where: { mimeType: { contains: 'image/' } }, limit: 1 })
  assert.ok(media.docs[0], 'Une image locale est nécessaire pour tester la publication.')
  const data = {
    title: 'Kit temporaire de vérification', slug,
    description: 'Fiche de contrôle locale.', contents: 'Contenu de contrôle.',
    priceCents: 2500, stock: 0, photos: [media.docs[0].id],
  }
  await assert.rejects(payload.create({ collection: 'products', overrideAccess: false, data }))
  await assert.rejects(payload.create({ collection: 'products', data: { ...data, stock: 1.5, _status: 'published' } }))
  const draft = await payload.create({ collection: 'products', draft: true, data: { ...data, _status: 'draft' } })
  id = draft.id
  const url = base + '/boutique/' + slug + '/'
  assert.equal((await fetch(url)).status, 404)
  await payload.update({ collection: 'products', id, data: { ...data, _status: 'published' } })
  const listing = await fetch(base + '/boutique/')
  assert.equal(listing.status, 200)
  assert.ok((await listing.text()).includes('/boutique/' + slug + '/'))
  const product = await fetch(url)
  assert.equal(product.status, 200)
  const page = await product.text()
  assert.match(page, /Kit temporaire de vérification/)
  assert.match(page, /Épuisé/)
  assert.match(page, /Contenu de contrôle/)
  await payload.update({ collection: 'products', id, data: { stock: 3 } })
  assert.doesNotMatch(await (await fetch(url)).text(), /Épuisé/)
  console.log('Boutique : accès, brouillon, publication, prix, contenu et état de stock vérifiés.')
} finally {
  if (id !== undefined) await payload.delete({ collection: 'products', id })
  await payload.destroy()
}
process.exit(0)
