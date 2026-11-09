import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { effectiveCalendarState, getRemainingSeats, getSeatSnapshot } from '../src/lib/availability.ts'
import { dayAvailability } from '../src/lib/calendar.ts'
import { getCalendarSessions } from '../src/lib/catalogue.ts'

const failures: string[] = []
const assert = (condition: boolean, message: string) => {
  if (!condition) failures.push(message)
}

const fails = async (action: () => Promise<unknown>) => {
  try {
    await action()
    return false
  } catch {
    return true
  }
}

const stamp = Date.now()
const slug = `controle-reservations-${stamp}`
const editorEmail = `editeur-resa-${stamp}@unica.local`
const payload = await getPayload({ config })

let workshopId: number | string | null = null
let sessionId: number | string | null = null
let otherSessionId: number | string | null = null
let editorId: number | string | null = null
const reservationIds: Array<number | string> = []

try {
  const workshop = await payload.create({
    collection: 'workshops',
    overrideAccess: true,
    data: {
      title: 'Contrôle réservations',
      slug,
      summary: 'Contrôle',
      description: 'Contrôle',
      priceCents: 4500,
      depositCents: 1000,
      _status: 'published',
    },
  })
  workshopId = workshop.id

  const session = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    data: {
      workshop: workshop.id,
      startsAt: '2099-08-15T09:00:00.000Z',
      endsAt: '2099-08-15T12:00:00.000Z',
      capacity: 3,
      state: 'scheduled',
      place: 'Atelier de contrôle',
      _status: 'published',
    },
  })
  sessionId = session.id

  const other = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    data: {
      workshop: workshop.id,
      startsAt: '2099-08-22T09:00:00.000Z',
      endsAt: '2099-08-22T12:00:00.000Z',
      capacity: 4,
      state: 'scheduled',
      _status: 'published',
    },
  })
  otherSessionId = other.id

  assert((await getRemainingSeats(payload, session.id)) === 3, 'Les places initiales devraient être 3')

  const first = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: `ada-${stamp}@unica.local`,
      phone: '0600000001',
      participants: 1,
      status: 'confirmed',
      origin: 'manual',
      totalCents: 4500,
      depositCents: 1000,
      paidCents: 0,
    },
  })
  reservationIds.push(first.id)
  assert(first.balanceCents === 4500, 'Le solde devrait être le total tant que rien n’est payé')
  assert(first.paidCents === 0, 'Aucun paiement ne doit être inventé')
  assert((await getRemainingSeats(payload, session.id)) === 2, 'Après une place, il devrait rester 2')

  const multi = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Grace',
      lastName: 'Hopper',
      email: `grace-${stamp}@unica.local`,
      participants: 2,
      status: 'confirmed',
      origin: 'manual',
      totalCents: 9000,
      depositCents: 2000,
      paidCents: 0,
    },
  })
  reservationIds.push(multi.id)
  assert((await getRemainingSeats(payload, session.id)) === 0, 'La dernière place devrait être prise')
  const fullSnap = await getSeatSnapshot(payload, session.id)
  assert(fullSnap?.state === 'full', 'La session devrait passer à complète')

  const oversell = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: session.id,
        firstName: 'Trop',
        lastName: 'Plein',
        email: `trop-${stamp}@unica.local`,
        participants: 1,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  )
  assert(oversell, 'Le dépassement de capacité a été accepté')

  await payload.update({
    collection: 'reservations',
    id: multi.id,
    overrideAccess: true,
    data: { status: 'cancelled' },
  })
  assert((await getRemainingSeats(payload, session.id)) === 2, 'L’annulation devrait libérer 2 places')
  assert((await getSeatSnapshot(payload, session.id))?.state === 'scheduled', 'La session devrait redevenir programmée')

  const lastSeat = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Derniere',
      lastName: 'Place',
      email: `last-${stamp}@unica.local`,
      participants: 2,
      status: 'confirmed',
      origin: 'manual',
    },
  })
  reservationIds.push(lastSeat.id)
  assert((await getRemainingSeats(payload, session.id)) === 0, 'La reprise des dernières places a échoué')

  await payload.update({
    collection: 'reservations',
    id: lastSeat.id,
    overrideAccess: true,
    data: { status: 'cancelled' },
  })
  await payload.update({
    collection: 'reservations',
    id: first.id,
    overrideAccess: true,
    data: { status: 'cancelled' },
  })
  assert((await getRemainingSeats(payload, session.id)) === 3, 'Toutes les places devraient être libres avant la retenue')

  const heldPast = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Hold',
      lastName: 'Actif',
      email: `hold-${stamp}@unica.local`,
      participants: 2,
      status: 'held',
      origin: 'online',
      heldUntil: new Date(Date.now() + 60_000).toISOString(),
    },
  })
  reservationIds.push(heldPast.id)
  assert((await getRemainingSeats(payload, session.id)) === 1, 'Une retenue active doit occuper des places')

  const blockedByHold = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: session.id,
        firstName: 'Bloque',
        lastName: 'Hold',
        email: `bloque-${stamp}@unica.local`,
        participants: 2,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  )
  assert(blockedByHold, 'Une retenue active n’a pas bloqué la survente')

  const pool = (payload.db as { pool: { query: (text: string, params?: unknown[]) => Promise<unknown> } }).pool
  await pool.query(`UPDATE reservations SET held_until = NOW() - interval '1 minute' WHERE id = $1`, [heldPast.id])
  assert((await getRemainingSeats(payload, session.id)) === 3, 'Une retenue expirée doit libérer les places')

  const raceSession = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    data: {
      workshop: workshop.id,
      startsAt: '2099-09-01T09:00:00.000Z',
      endsAt: '2099-09-01T12:00:00.000Z',
      capacity: 1,
      state: 'scheduled',
      _status: 'published',
    },
  })
  const raceA = payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: raceSession.id,
      firstName: 'Race',
      lastName: 'Alpha',
      email: `race-a-${stamp}@unica.local`,
      participants: 1,
      status: 'confirmed',
      origin: 'manual',
    },
  })
  const raceB = payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: raceSession.id,
      firstName: 'Race',
      lastName: 'Beta',
      email: `race-b-${stamp}@unica.local`,
      participants: 1,
      status: 'confirmed',
      origin: 'manual',
    },
  })
  const raced = await Promise.allSettled([raceA, raceB])
  const fulfilled = raced.filter((item) => item.status === 'fulfilled')
  const rejected = raced.filter((item) => item.status === 'rejected')
  assert(fulfilled.length === 1, `Courses simultanées : ${fulfilled.length} succès`)
  assert(rejected.length === 1, `Courses simultanées : ${rejected.length} refus`)
  for (const item of fulfilled) {
    if (item.status === 'fulfilled') reservationIds.push((item.value as { id: number | string }).id)
  }
  assert((await getRemainingSeats(payload, raceSession.id)) === 0, 'Après course, plus aucune place')
  const raceReservations = await payload.find({
    collection: 'reservations',
    overrideAccess: true,
    limit: 10,
    where: { session: { equals: raceSession.id } },
  })
  for (const doc of raceReservations.docs) {
    reservationIds.push(doc.id)
  }
  await payload.delete({ collection: 'sessions', id: raceSession.id, overrideAccess: true }).catch(() => undefined)

  await payload.update({
    collection: 'sessions',
    id: session.id,
    overrideAccess: true,
    data: { state: 'cancelled' },
  })
  const cancelled = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: session.id,
        firstName: 'Annule',
        lastName: 'Session',
        email: `annule-${stamp}@unica.local`,
        participants: 1,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  )
  assert(cancelled, 'Une session annulée a accepté une réservation')
  await payload.update({
    collection: 'sessions',
    id: session.id,
    overrideAccess: true,
    data: { state: 'scheduled' },
  })

  const confirmed = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Confirme',
      lastName: 'UneFois',
      email: `once-${stamp}@unica.local`,
      participants: 1,
      status: 'confirmed',
      origin: 'manual',
      rescheduleTo: other.id,
      adminNote: 'Report envisagé',
    },
  })
  reservationIds.push(confirmed.id)
  const doubleConfirm = await fails(() =>
    payload.update({
      collection: 'reservations',
      id: confirmed.id,
      overrideAccess: true,
      data: { confirmedAt: new Date().toISOString() },
    }),
  )
  assert(doubleConfirm, 'Une double confirmation a été acceptée')

  const anonymous = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: false,
      data: {
        session: session.id,
        firstName: 'Visiteur',
        lastName: 'Public',
        email: `visiteur-${stamp}@unica.local`,
        participants: 1,
        status: 'confirmed',
        origin: 'online',
      },
    }),
  )
  assert(anonymous, 'Un visiteur a pu créer une réservation')

  const editor = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email: editorEmail, password: `editor-${stamp}-local`, role: 'editor' },
  })
  editorId = editor.id

  const manual = await payload.create({
    collection: 'reservations',
    overrideAccess: false,
    user: editor,
    data: {
      session: other.id,
      firstName: 'Marie',
      lastName: 'Editeur',
      email: `marie-${stamp}@unica.local`,
      participants: 1,
      status: 'confirmed',
      origin: 'manual',
      totalCents: 4500,
      paidCents: 0,
    },
  })
  reservationIds.push(manual.id)
  assert((await getRemainingSeats(payload, other.id)) === 3, 'L’inscription manuelle éditeur n’a pas diminué les places')

  const editorDelete = await fails(() =>
    payload.delete({ collection: 'reservations', id: manual.id, overrideAccess: false, user: editor }),
  )
  assert(editorDelete, 'Un éditeur a pu supprimer une réservation')

  await payload.update({
    collection: 'reservations',
    id: manual.id,
    overrideAccess: false,
    user: editor,
    data: { status: 'cancelled' },
  })
  assert((await getRemainingSeats(payload, other.id)) === 4, 'L’annulation éditeur n’a pas libéré la place')

  const calendar = await getCalendarSessions()
  const visible = calendar.find((item) => item.id === String(other.id))
  assert(Boolean(visible), 'La session de contrôle n’apparaît pas au calendrier')
  assert(visible?.remainingSeats === 4, `Places calendrier incorrectes : ${visible?.remainingSeats}`)
  assert(effectiveCalendarState('scheduled', 0) === 'full', 'Une session à 0 place doit être complète')
  assert(dayAvailability([{ state: 'scheduled', remainingSeats: 0 }]) === 'full', 'Le jour complet est mal détecté')
  assert(dayAvailability([{ state: 'scheduled', remainingSeats: 2 }]) === 'open', 'Le jour ouvert est mal détecté')
} finally {
  for (const id of reservationIds) {
    await payload.delete({ collection: 'reservations', id, overrideAccess: true }).catch(() => undefined)
  }
  const leftovers = await payload.find({
    collection: 'reservations',
    overrideAccess: true,
    limit: 50,
    where: { email: { contains: String(stamp) } },
  })
  for (const doc of leftovers.docs) {
    await payload.delete({ collection: 'reservations', id: doc.id, overrideAccess: true }).catch(() => undefined)
  }
  if (sessionId != null) {
    await payload.delete({ collection: 'sessions', id: sessionId, overrideAccess: true }).catch(() => undefined)
  }
  if (otherSessionId != null) {
    await payload.delete({ collection: 'sessions', id: otherSessionId, overrideAccess: true }).catch(() => undefined)
  }
  const straySessions = await payload.find({
    collection: 'sessions',
    overrideAccess: true,
    draft: true,
    limit: 20,
    where: { place: { equals: 'Atelier de contrôle' } },
  })
  for (const doc of straySessions.docs) {
    if (String(doc.startsAt || '').startsWith('2099-')) {
      await payload.delete({ collection: 'sessions', id: doc.id, overrideAccess: true }).catch(() => undefined)
    }
  }
  if (workshopId != null) {
    await payload.delete({ collection: 'workshops', id: workshopId, overrideAccess: true }).catch(() => undefined)
  }
  if (editorId != null) {
    await payload.delete({ collection: 'users', id: editorId, overrideAccess: true }).catch(() => undefined)
  }
  await payload.destroy()
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Réservations et disponibilités vérifiées')
process.exit(0)
