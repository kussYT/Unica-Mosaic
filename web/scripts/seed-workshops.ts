import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { workshops } from '../src/data/site.ts'
import { databaseTargetError } from '../src/lib/database-target.ts'

const databaseFailure = databaseTargetError(
  process.env.DATABASE_URL || '',
  process.env.UNICA_RUNTIME,
  process.env.NODE_ENV,
)
if (databaseFailure) throw new Error(databaseFailure)
if (process.env.NODE_ENV === 'production' && process.env.UNICA_RUNTIME !== 'preview') {
  throw new Error('Refusing to prepare workshop drafts when NODE_ENV is production')
}

const payload = await getPayload({ config })
const tones = new Set(['pink', 'blush', 'plum', 'cream'])

try {
  for (const workshop of workshops) {
    const existing = await payload.find({
      collection: 'workshops',
      overrideAccess: true,
      draft: true,
      limit: 1,
      where: { slug: { equals: workshop.slug } },
    })
    if (existing.totalDocs > 0) {
      console.log(`Déjà présent, laissé intact : ${workshop.slug}`)
      continue
    }
    await payload.create({
      collection: 'workshops',
      overrideAccess: true,
      draft: true,
      data: {
        title: workshop.name,
        slug: workshop.slug,
        label: workshop.label,
        summary: workshop.intro,
        description: workshop.description,
        practicalInfo: workshop.detail,
        tone: tones.has(workshop.tone) ? (workshop.tone as 'pink' | 'blush' | 'plum' | 'cream') : 'pink',
        _status: 'draft',
      },
    })
    console.log(`Brouillon préparé, sans tarif ni date : ${workshop.slug}`)
  }
} finally {
  await payload.destroy()
}

process.exit(0)
