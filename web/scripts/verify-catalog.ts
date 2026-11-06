import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { getPublicWorkshops } from '../src/lib/catalogue.ts'
import { buildMonth, parisDayKey } from '../src/lib/calendar.ts'

const failures: string[] = []
const assert = (condition: boolean, message: string) => {
  if (!condition) failures.push(message)
}

const payload = await getPayload({ config })
const stamp = Date.now()
const slug = `controle-technique-${stamp}`
const email = `editeur-${stamp}@unica.local`
let workshopId: number | string | null = null
let editorId: number | string | null = null
const sessionIds: Array<number | string> = []

try {
  const negative = await fails(() =>
    payload.create({
      collection: 'workshops',
      draft: true,
      overrideAccess: true,
      data: { title: 'Négatif', slug: `${slug}-negatif`, summary: 'Contrôle', description: 'Contrôle', priceCents: -1 },
    }),
  )
  assert(negative, 'Un tarif négatif a été accepté')

  const deposit = await fails(() =>
    payload.create({
      collection: 'workshops',
      draft: true,
      overrideAccess: true,
      data: {
        title: 'Acompte',
        slug: `${slug}-acompte`,
        summary: 'Contrôle',
        description: 'Contrôle',
        priceCents: 1000,
        depositCents: 2000,
      },
    }),
  )
  assert(deposit, 'Un acompte supérieur au tarif a été accepté')

  const anonymous = await fails(() =>
    payload.create({
      collection: 'workshops',
      overrideAccess: false,
      data: { title: 'Anonyme', slug: `${slug}-anonyme`, summary: 'Contrôle', description: 'Contrôle' },
    }),
  )
  assert(anonymous, 'Un visiteur a pu créer un atelier')

  const draft = await payload.create({
    collection: 'workshops',
    draft: true,
    overrideAccess: true,
    data: { title: 'Contrôle technique', slug, summary: 'Texte de contrôle.', description: 'Description de contrôle.' },
  })
  workshopId = draft.id

  const premature = await fails(() =>
    payload.update({
      collection: 'workshops',
      id: draft.id,
      overrideAccess: true,
      data: { _status: 'published' },
    }),
  )
  assert(premature, 'Un atelier sans tarif a pu être publié')

  const published = await payload.update({
    collection: 'workshops',
    id: draft.id,
    overrideAccess: true,
    data: { _status: 'published', priceCents: 0, depositCents: 0 },
  })
  assert(published._status === 'published', 'La publication avec un tarif à zéro a échoué')

  const firstStart = '2099-03-12T09:00:00.000Z'
  const first = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    draft: true,
    data: { workshop: draft.id, startsAt: firstStart, endsAt: '2099-03-12T12:00:00.000Z', state: 'scheduled', place: 'Atelier de contrôle' },
  })
  sessionIds.push(first.id)
  const moved = await payload.update({
    collection: 'sessions',
    id: first.id,
    overrideAccess: true,
    data: { startsAt: '2099-03-12T10:00:00.000Z', endsAt: '2099-03-12T13:00:00.000Z', _status: 'published', capacity: 8 },
  })
  assert(moved.startsAt?.startsWith('2099-03-12T10:'), 'La modification de session n’a pas été enregistrée')

  const missingCapacity = await fails(() =>
    payload.create({
      collection: 'sessions',
      overrideAccess: true,
      data: {
        workshop: draft.id,
        startsAt: '2099-03-20T09:00:00.000Z',
        endsAt: '2099-03-20T12:00:00.000Z',
        state: 'scheduled',
        _status: 'published',
      },
    }),
  )
  assert(missingCapacity, 'Une session sans capacité a été publiée')
  for (const capacity of [0, -3, 1.5]) {
    const rejected = await fails(() =>
      payload.create({
        collection: 'sessions',
        overrideAccess: true,
        draft: true,
        data: {
          workshop: draft.id,
          startsAt: '2099-03-21T09:00:00.000Z',
          endsAt: '2099-03-21T12:00:00.000Z',
          state: 'scheduled',
          capacity,
        },
      }),
    )
    assert(rejected, `La capacité ${capacity} a été acceptée`)
  }

  const second = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    data: {
      workshop: draft.id,
      startsAt: '2099-04-02T14:00:00.000Z',
      endsAt: '2099-04-02T16:00:00.000Z',
      state: 'full',
      capacity: 6,
      _status: 'published',
    },
  })
  sessionIds.push(second.id)

  const backwards = await fails(() =>
    payload.create({
      collection: 'sessions',
      overrideAccess: true,
      draft: true,
      data: { workshop: draft.id, startsAt: '2099-05-01T15:00:00.000Z', endsAt: '2099-05-01T14:00:00.000Z', state: 'scheduled' },
    }),
  )
  assert(backwards, 'Une session qui se termine avant de commencer a été acceptée')

  const catalogue = await getPublicWorkshops()
  for (const known of ['recolle-toi-meuf', 'pixel-kids', 'ma-croix-mes-couleurs', 'numero-de-maison']) {
    assert(catalogue.some((item) => item.slug === known), `La publication d’une fiche a masqué ${known}`)
  }
  assert(catalogue.some((item) => item.slug === slug), 'La fiche publiée n’est pas au catalogue')
  const march = buildMonth(2026, 3)
  assert(march.lead === 6 && march.days === 31, 'La grille de mars 2026 est incorrecte')
  assert(parisDayKey('2026-03-28T23:30:00.000Z') === '2026-03-29', 'Le jour Paris d’une session est incorrect')

  const visible = await payload.find({
    collection: 'sessions',
    overrideAccess: false,
    where: { workshop: { equals: draft.id } },
  })
  assert(visible.totalDocs === 2, `Les sessions publiées visibles sont ${visible.totalDocs}`)

  const hidden = await payload.update({
    collection: 'workshops',
    id: draft.id,
    overrideAccess: true,
    data: { _status: 'draft' },
  })
  assert(hidden._status === 'draft', 'Le retour en brouillon a échoué')
  const publicWorkshops = await payload.find({
    collection: 'workshops',
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })
  assert(publicWorkshops.totalDocs === 0, 'Un brouillon d’atelier est visible sans connexion')

  const editor = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password: `editor-${stamp}-local`, role: 'editor' },
  })
  editorId = editor.id
  const edited = await payload.update({
    collection: 'workshops',
    id: draft.id,
    overrideAccess: false,
    user: editor,
    draft: true,
    data: { summary: 'Texte modifié par l’éditeur.' },
  })
  assert(edited.summary === 'Texte modifié par l’éditeur.', 'Un éditeur n’a pas pu modifier l’atelier')
  const removed = await fails(() =>
    payload.delete({ collection: 'workshops', id: draft.id, overrideAccess: false, user: editor }),
  )
  assert(removed, 'Un éditeur a pu supprimer un atelier')
} finally {
  for (const id of sessionIds) {
    await payload.delete({ collection: 'sessions', id, overrideAccess: true }).catch(() => undefined)
  }
  if (workshopId != null) {
    await payload.delete({ collection: 'workshops', id: workshopId, overrideAccess: true }).catch(() => undefined)
  }
  if (editorId != null) {
    await payload.delete({ collection: 'users', id: editorId, overrideAccess: true }).catch(() => undefined)
  }
  const rejected = await payload.find({
    collection: 'workshops',
    overrideAccess: true,
    draft: true,
    limit: 20,
    where: { slug: { contains: String(stamp) } },
  })
  for (const doc of rejected.docs) {
    await payload.delete({ collection: 'workshops', id: doc.id, overrideAccess: true }).catch(() => undefined)
  }
  const leftover = await payload.find({
    collection: 'workshops',
    overrideAccess: true,
    draft: true,
    limit: 20,
    where: { slug: { contains: String(stamp) } },
  })
  assert(leftover.totalDocs === 0, 'L’atelier de contrôle est resté en base')
  await payload.destroy()
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Catalogue ateliers et sessions vérifié')
process.exit(0)

async function fails(action: () => Promise<unknown>) {
  try {
    await action()
    return false
  } catch {
    return true
  }
}
