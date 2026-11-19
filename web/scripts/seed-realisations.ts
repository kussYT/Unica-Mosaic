import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { works } from '../src/data/site.ts'

const target = new URL(process.env.DATABASE_URL || 'postgres://invalid')
if (!['localhost', '127.0.0.1'].includes(target.hostname) ||
  target.port !== '5433' || target.pathname !== '/unica_mosaic_local' ||
  process.env.UNICA_RUNTIME === 'preview') {
  throw new Error('Import de préparation autorisé uniquement sur la base locale UNICA.')
}

const payload = await getPayload({ config })
try {
  for (const [index, work] of works.entries()) {
    const existing = await payload.find({
      collection: 'realisations', draft: true, limit: 1, where: { title: { equals: work.title } },
    })
    if (existing.docs.length) continue
    const filename = work.image + '-1600.webp'
    const media = await payload.find({
      collection: 'media', limit: 1, where: { filename: { equals: filename } },
    })
    const photo = media.docs[0] ?? await payload.create({
      collection: 'media',
      data: { alt: work.alt },
      filePath: fileURLToPath(new URL('../../public/images/' + filename, import.meta.url)),
    })
    await payload.create({
      collection: 'realisations',
      data: { title: work.title, photos: [photo.id], displayOrder: (index + 1) * 10, _status: 'published' },
    })
  }
  console.log('11 réalisations historiques disponibles, sans modifier les fichiers sources.')
} finally {
  await payload.destroy()
}
process.exit(0)
