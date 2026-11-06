import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config.ts'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const photoPath = path.resolve(dirname, '../../public/images/atelier-partage-960.webp')
const photoAlt = 'Photo temporaire utilisée seulement pour contrôler l’affichage du calendrier.'

const slug = 'controle-calendrier'
const remove = process.argv.includes('--remove')
const payload = await getPayload({ config })

try {
  const existing = await payload.find({
    collection: 'workshops',
    overrideAccess: true,
    draft: true,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  const mediaIds = (doc: { gallery?: unknown }): Array<number | string> => {
    if (!Array.isArray(doc.gallery)) return []
    return doc.gallery.flatMap((item) => {
      if (typeof item === 'number' || typeof item === 'string') return [item]
      if (item && typeof item === 'object' && 'id' in item) {
        const id = item.id
        return typeof id === 'number' || typeof id === 'string' ? [id] : []
      }
      return []
    })
  }

  if (remove) {
    for (const doc of existing.docs) {
      const sessions = await payload.find({
        collection: 'sessions',
        overrideAccess: true,
        draft: true,
        limit: 20,
        where: { workshop: { equals: doc.id } },
      })
      for (const session of sessions.docs) {
        await payload.delete({ collection: 'sessions', id: session.id, overrideAccess: true })
      }
      const photos = mediaIds(doc)
      await payload.delete({ collection: 'workshops', id: doc.id, overrideAccess: true })
      for (const id of photos) {
        await payload.delete({ collection: 'media', id, overrideAccess: true })
      }
    }
    console.log('Contrôle calendrier retiré')
  } else if (existing.totalDocs === 0) {
    const workshop = await payload.create({
      collection: 'workshops',
      overrideAccess: true,
      data: {
        title: 'Contrôle calendrier',
        slug,
        label: 'CONTRÔLE TECHNIQUE',
        summary: 'Fiche temporaire de contrôle. Elle ne décrit pas un atelier UNICA.',
        description: 'Donnée de développement, à supprimer après le contrôle du calendrier.',
        tone: 'plum',
        priceCents: 0,
        depositCents: 0,
        _status: 'published',
      },
    })
    await payload.create({
      collection: 'sessions',
      overrideAccess: true,
      data: {
        workshop: workshop.id,
        startsAt: '2026-12-05T09:00:00.000Z',
        endsAt: '2026-12-05T12:00:00.000Z',
        capacity: 4,
        place: 'Contrôle technique',
        state: 'scheduled',
        _status: 'published',
      },
    })
    await payload.create({
      collection: 'sessions',
      overrideAccess: true,
      data: {
        workshop: workshop.id,
        startsAt: '2026-12-12T14:00:00.000Z',
        endsAt: '2026-12-12T16:00:00.000Z',
        capacity: 6,
        place: 'Contrôle technique',
        state: 'full',
        _status: 'published',
      },
    })
    const photo = await payload.create({
      collection: 'media',
      overrideAccess: true,
      filePath: photoPath,
      data: { alt: photoAlt },
    })
    await payload.update({
      collection: 'workshops',
      id: workshop.id,
      overrideAccess: true,
      data: { gallery: [photo.id], _status: 'published' },
    })
    console.log('Contrôle calendrier créé')
  } else {
    const doc = existing.docs[0]
    if (mediaIds(doc).length === 0) {
      const photo = await payload.create({
        collection: 'media',
        overrideAccess: true,
        filePath: photoPath,
        data: { alt: photoAlt },
      })
      await payload.update({
        collection: 'workshops',
        id: doc.id,
        overrideAccess: true,
        data: { gallery: [photo.id], _status: 'published' },
      })
      console.log('Photo de contrôle ajoutée')
    } else {
      console.log('Contrôle calendrier déjà présent')
    }
  }
} finally {
  await payload.destroy()
}

process.exit(0)
