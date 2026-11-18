/**
 * Validation bout-en-bout du lot 4A.
 * Crée des données isolées, contrôle Payload + PostgreSQL + calendrier, puis nettoie.
 */
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { getRemainingSeats, getSeatSnapshot } from '../src/lib/availability.ts'
import { getCalendarSessions } from '../src/lib/catalogue.ts'

type Row = Record<string, unknown>

const failures: string[] = []
const results: string[] = []
const assert = (condition: boolean, message: string) => {
  if (condition) results.push(`OK  ${message}`)
  else failures.push(message)
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
const slug = `validation-4a-${stamp}`
const payload = await getPayload({ config })
const pool = (payload.db as { pool: { query: (text: string, params?: unknown[]) => Promise<{ rows: Row[] }> } }).pool

const sqlRemaining = async (sessionId: number | string) => {
  const result = await pool.query(
    `SELECT s.capacity::int AS capacity,
            s.state::text AS state,
            COALESCE((
              SELECT SUM(r.participants)::int
              FROM reservations r
              WHERE r.session_id = s.id
                AND (
                  r.status = 'confirmed'
                  OR (r.status = 'held' AND r.held_until IS NOT NULL AND r.held_until > NOW())
                )
            ), 0) AS occupied
     FROM sessions s
     WHERE s.id = $1`,
    [sessionId],
  )
  const row = result.rows[0]
  if (!row) return null
  const capacity = Number(row.capacity)
  const occupied = Number(row.occupied)
  return {
    capacity,
    occupied,
    remaining: capacity - occupied,
    state: String(row.state),
  }
}

const calendarSeat = async (sessionId: number | string) => {
  const sessions = await getCalendarSessions()
  return sessions.find((item) => item.id === String(sessionId)) || null
}

let workshopId: number | string | null = null
let sessionId: number | string | null = null
let raceSessionId: number | string | null = null
let editorId: number | string | null = null
const reservationIds: Array<number | string> = []

try {
  // --- Migrations / déclencheurs ---
  const migrations = await pool.query(`SELECT name FROM payload_migrations ORDER BY id`)
  const names = migrations.rows.map((row) => String(row.name))
  assert(names.includes('20261108_160000_reservations'), 'Migration réservations présente')
  assert(names.includes('20261108_161000_reservation_session_sync'), 'Migration sync session présente')
  assert(names.includes('20261108_161100_reservation_hold_expiry'), 'Migration expiration retenues présente')
  const triggers = await pool.query(
    `SELECT tgname FROM pg_trigger WHERE tgrelid = 'reservations'::regclass AND NOT tgisinternal`,
  )
  const triggerNames = triggers.rows.map((row) => String(row.tgname))
  assert(triggerNames.includes('reservations_enforce_capacity_trigger'), 'Déclencheur capacité actif')
  assert(triggerNames.includes('reservations_sync_session_state_trigger'), 'Déclencheur sync état actif')

  // Atomicité : le contrôle FOR UPDATE + écriture sont dans le même TX via BEFORE INSERT
  const triggerSrc = await pool.query(
    `SELECT pg_get_functiondef(oid) AS def FROM pg_proc WHERE proname = 'reservations_enforce_capacity'`,
  )
  const def = String(triggerSrc.rows[0]?.def || '')
  assert(def.includes('FOR UPDATE'), 'Le contrôle de capacité verrouille la session (FOR UPDATE)')
  assert(def.includes('occupied + NEW.participants'), 'Le contrôle compare occupation + demande dans le déclencheur')

  // --- Atelier + session capacité 8 ---
  const workshop = await payload.create({
    collection: 'workshops',
    overrideAccess: true,
    data: {
      title: 'Validation lot 4A',
      slug,
      summary: 'Contrôle validation',
      description: 'Contrôle validation',
      priceCents: 5000,
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
      startsAt: '2099-11-20T09:00:00.000Z',
      endsAt: '2099-11-20T12:00:00.000Z',
      capacity: 8,
      state: 'scheduled',
      place: 'Atelier validation 4A',
      _status: 'published',
    },
  })
  sessionId = session.id

  let db = await sqlRemaining(session.id)
  assert(db?.remaining === 8, `SQL places initiales = ${db?.remaining}`)
  let cal = await calendarSeat(session.id)
  assert(Boolean(cal), 'La session apparaît dans le calendrier')
  assert(cal?.remainingSeats === 8, `Calendrier places initiales = ${cal?.remainingSeats}`)
  assert(cal?.state === 'scheduled', 'État calendrier initial = scheduled')

  // 1) Inscription manuelle 2 participants
  const two = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Marie',
      lastName: 'Test',
      email: `marie-2-${stamp}@unica.local`,
      phone: '0600000002',
      participants: 2,
      status: 'confirmed',
      origin: 'manual',
      totalCents: 10000,
      depositCents: 2000,
      paidCents: 0,
    },
  })
  reservationIds.push(two.id)
  assert(two.paidCents === 0, 'paidCents reste à 0 sans paiement réel')
  assert(two.balanceCents === 10000, `Solde à encaisser = ${two.balanceCents}`)
  db = await sqlRemaining(session.id)
  assert(db?.remaining === 6 && db.occupied === 2, `SQL après 2 : remaining=${db?.remaining} occupied=${db?.occupied}`)
  cal = await calendarSeat(session.id)
  assert(cal?.remainingSeats === 6, `Calendrier après 2 = ${cal?.remainingSeats}`)

  // 2) Avec 6 places : 5 doit être acceptée (math), 7 refusée, 6 acceptée → complète
  //    (consigne « 5 refusée » serait incorrecte avec 6 places ; on refuse le dépassement.)
  const fiveOk = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: session.id,
        firstName: 'Cinq',
        lastName: 'Temp',
        email: `cinq-${stamp}@unica.local`,
        participants: 5,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  )
  assert(!fiveOk, 'Avec 6 places, une inscription de 5 doit être acceptée (contrôle mathématique)')
  // Annuler immédiatement cette inscription de 5 pour enchaîner le scénario 6 → complète
  const fiveDoc = await payload.find({
    collection: 'reservations',
    overrideAccess: true,
    limit: 1,
    where: { email: { equals: `cinq-${stamp}@unica.local` } },
  })
  if (fiveDoc.docs[0]) {
    reservationIds.push(fiveDoc.docs[0].id)
    await payload.update({
      collection: 'reservations',
      id: fiveDoc.docs[0].id,
      overrideAccess: true,
      data: { status: 'cancelled' },
    })
  }
  db = await sqlRemaining(session.id)
  assert(db?.remaining === 6, `SQL remis à 6 après annulation du 5 = ${db?.remaining}`)

  const oversell = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: session.id,
        firstName: 'Trop',
        lastName: 'Plein',
        email: `trop7-${stamp}@unica.local`,
        participants: 7,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  )
  assert(oversell, 'Une inscription de 7 (dépassement) est refusée')

  const six = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Six',
      lastName: 'Places',
      email: `six-${stamp}@unica.local`,
      participants: 6,
      status: 'confirmed',
      origin: 'manual',
      totalCents: 30000,
      paidCents: 0,
    },
  })
  reservationIds.push(six.id)
  db = await sqlRemaining(session.id)
  assert(db?.remaining === 0 && db.state === 'full', `SQL session complète : remaining=${db?.remaining} state=${db?.state}`)
  cal = await calendarSeat(session.id)
  assert(cal?.remainingSeats === 0 && cal?.state === 'full', `Calendrier complet : seats=${cal?.remainingSeats} state=${cal?.state}`)

  // Annulation des 2 → libère 2 places
  await payload.update({
    collection: 'reservations',
    id: two.id,
    overrideAccess: true,
    data: { status: 'cancelled' },
  })
  db = await sqlRemaining(session.id)
  assert(db?.remaining === 2 && db.state === 'scheduled', `SQL après annulation 2 : remaining=${db?.remaining} state=${db?.state}`)
  cal = await calendarSeat(session.id)
  assert(cal?.remainingSeats === 2, `Calendrier après annulation = ${cal?.remainingSeats}`)

  // --- Robustesse : course sur dernière place ---
  const race = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    data: {
      workshop: workshop.id,
      startsAt: '2099-11-21T09:00:00.000Z',
      endsAt: '2099-11-21T12:00:00.000Z',
      capacity: 1,
      state: 'scheduled',
      _status: 'published',
    },
  })
  raceSessionId = race.id
  const raced = await Promise.allSettled([
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: race.id,
        firstName: 'A',
        lastName: 'Race',
        email: `race-a-${stamp}@unica.local`,
        participants: 1,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: race.id,
        firstName: 'B',
        lastName: 'Race',
        email: `race-b-${stamp}@unica.local`,
        participants: 1,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  ])
  const okRace = raced.filter((item) => item.status === 'fulfilled')
  const koRace = raced.filter((item) => item.status === 'rejected')
  assert(okRace.length === 1 && koRace.length === 1, `Course dernière place : ${okRace.length} ok / ${koRace.length} refus`)
  for (const item of okRace) {
    if (item.status === 'fulfilled') reservationIds.push((item.value as { id: number | string }).id)
  }
  const raceDb = await sqlRemaining(race.id)
  assert(raceDb?.occupied === 1 && raceDb.remaining === 0, 'Pas de survente après course')

  // --- Statuts : pending / held / confirmed / cancelled / expired ---
  await payload.update({
    collection: 'reservations',
    id: six.id,
    overrideAccess: true,
    data: { status: 'cancelled' },
  })
  // session principale : 0 occupied after cancelling six and two
  db = await sqlRemaining(session.id)
  assert(db?.remaining === 8, `Session principale libérée = ${db?.remaining}`)

  const pending = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Pending',
      lastName: 'Wait',
      email: `pending-${stamp}@unica.local`,
      participants: 3,
      status: 'pending',
      origin: 'online',
      paidCents: 0,
    },
  })
  reservationIds.push(pending.id)
  db = await sqlRemaining(session.id)
  assert(db?.occupied === 0, 'pending n’occupe pas de places')

  const held = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Hold',
      lastName: 'Active',
      email: `hold-${stamp}@unica.local`,
      participants: 3,
      status: 'held',
      origin: 'online',
      heldUntil: new Date(Date.now() + 120_000).toISOString(),
      paidCents: 0,
    },
  })
  reservationIds.push(held.id)
  db = await sqlRemaining(session.id)
  assert(db?.occupied === 3 && db.remaining === 5, `held actif occupe : occupied=${db?.occupied}`)

  const blocked = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: session.id,
        firstName: 'Block',
        lastName: 'Hold',
        email: `block-${stamp}@unica.local`,
        participants: 6,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  )
  assert(blocked, 'Une retenue active bloque la survente')

  await pool.query(`UPDATE reservations SET held_until = NOW() - interval '1 minute' WHERE id = $1`, [held.id])
  db = await sqlRemaining(session.id)
  // trigger converts to expired on next write; count ignores past held even before status flip
  assert(db?.occupied === 0, `held expiré (temps) ne compte plus : occupied=${db?.occupied}`)
  const expiredRow = await pool.query(`SELECT status::text AS status FROM reservations WHERE id = $1`, [held.id])
  // status may still be held until a write; force expire via SQL update path
  await pool.query(
    `UPDATE reservations SET held_until = NOW() - interval '1 minute', status = 'held' WHERE id = $1`,
    [held.id],
  )
  // Touch via trigger by updating a no-op field through raw UPDATE that hits BEFORE trigger
  await pool.query(
    `UPDATE reservations SET participants = participants WHERE id = $1`,
    [held.id],
  )
  const afterExpire = await pool.query(`SELECT status::text AS status, expired_at IS NOT NULL AS has_exp FROM reservations WHERE id = $1`, [
    held.id,
  ])
  assert(afterExpire.rows[0]?.status === 'expired', `Statut après expiration = ${afterExpire.rows[0]?.status}`)
  db = await sqlRemaining(session.id)
  assert(db?.remaining === 8, 'Places libérées après expiration')

  // confirmed occupe
  const conf = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Conf',
      lastName: 'Ok',
      email: `conf-${stamp}@unica.local`,
      participants: 8,
      status: 'confirmed',
      origin: 'manual',
      paidCents: 0,
      totalCents: 40000,
    },
  })
  reservationIds.push(conf.id)
  db = await sqlRemaining(session.id)
  assert(db?.state === 'full' && db.remaining === 0, 'confirmed remplit la session')

  // Capacité augmentée sur session pleine
  await payload.update({
    collection: 'sessions',
    id: session.id,
    overrideAccess: true,
    data: { capacity: 10 },
  })
  db = await sqlRemaining(session.id)
  assert(db?.remaining === 2 && db.state === 'scheduled', `Après hausse capacité : remaining=${db?.remaining} state=${db?.state}`)
  cal = await calendarSeat(session.id)
  assert(cal?.remainingSeats === 2 && cal?.state === 'scheduled', 'Calendrier suit la hausse de capacité')

  // Session annulée refuse
  await payload.update({
    collection: 'sessions',
    id: session.id,
    overrideAccess: true,
    data: { state: 'cancelled' },
  })
  const onCancelled = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: true,
      data: {
        session: session.id,
        firstName: 'No',
        lastName: 'Cancel',
        email: `cancel-sess-${stamp}@unica.local`,
        participants: 1,
        status: 'confirmed',
        origin: 'manual',
      },
    }),
  )
  assert(onCancelled, 'Inscription refusée sur session annulée')
  await payload.update({
    collection: 'sessions',
    id: session.id,
    overrideAccess: true,
    data: { state: 'scheduled' },
  })

  // Quantités invalides
  for (const bad of [0, -1, 1.5, null]) {
    const rejected = await fails(() =>
      payload.create({
        collection: 'reservations',
        overrideAccess: true,
        data: {
          session: session.id,
          firstName: 'Bad',
          lastName: 'Qty',
          email: `bad-${bad}-${stamp}@unica.local`,
          participants: bad as number,
          status: 'confirmed',
          origin: 'manual',
        },
      }),
    )
    assert(rejected, `Quantité invalide refusée (${bad})`)
  }

  // Droits
  const visitor = await fails(() =>
    payload.create({
      collection: 'reservations',
      overrideAccess: false,
      data: {
        session: session.id,
        firstName: 'Visiteur',
        lastName: 'Public',
        email: `visitor-${stamp}@unica.local`,
        participants: 1,
        status: 'confirmed',
        origin: 'online',
      },
    }),
  )
  assert(visitor, 'Visiteur ne peut pas créer de réservation')

  const editor = await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email: `editeur-4a-${stamp}@unica.local`, password: `editor-${stamp}-local`, role: 'editor' },
  })
  editorId = editor.id
  const editorResa = await payload.create({
    collection: 'reservations',
    overrideAccess: false,
    user: editor,
    data: {
      session: session.id,
      firstName: 'Editeur',
      lastName: 'Marie',
      email: `editeur-resa-${stamp}@unica.local`,
      phone: '0600000011',
      participants: 1,
      status: 'confirmed',
      origin: 'manual',
      totalCents: 5000,
      paidCents: 0,
    },
  })
  reservationIds.push(editorResa.id)
  assert(editorResa.balanceCents === 5000, 'Éditeur voit un solde à encaisser non payé')
  const editorDelete = await fails(() =>
    payload.delete({ collection: 'reservations', id: editorResa.id, overrideAccess: false, user: editor }),
  )
  assert(editorDelete, 'Éditeur ne peut pas supprimer une réservation')
  const cancelledByEditor = await payload.update({
    collection: 'reservations',
    id: editorResa.id,
    overrideAccess: false,
    user: editor,
    data: { status: 'cancelled' },
  })
  assert(cancelledByEditor.status === 'cancelled', 'Éditeur peut annuler une inscription')

  // Cache public : force-dynamic sur l’accueil
  const pageSrc = await import('node:fs').then((fs) =>
    fs.readFileSync(new URL('../src/app/(site)/page.tsx', import.meta.url), 'utf8'),
  )
  assert(pageSrc.includes("dynamic = 'force-dynamic'"), 'Accueil en force-dynamic (pas de cache stale)')

  // Admin : champs consultables
  assert(typeof editorResa.firstName === 'string' && typeof editorResa.lastName === 'string', 'Nom participant présent')
  assert(typeof editorResa.email === 'string', 'E-mail participant présent')
  assert(typeof editorResa.participants === 'number', 'Nombre de places réservées présent')
  assert(typeof editorResa.status === 'string', 'Statut consultable')
  assert(typeof editorResa.balanceCents === 'number', 'Solde à encaisser présent')
  assert(Boolean(editorResa.session), 'Session concernée liée à la réservation')
} finally {
  for (const id of reservationIds) {
    await payload.delete({ collection: 'reservations', id, overrideAccess: true }).catch(() => undefined)
  }
  const leftoverResa = await payload.find({
    collection: 'reservations',
    overrideAccess: true,
    limit: 100,
    where: { email: { contains: String(stamp) } },
  })
  for (const doc of leftoverResa.docs) {
    await payload.delete({ collection: 'reservations', id: doc.id, overrideAccess: true }).catch(() => undefined)
  }
  if (sessionId != null) {
    await payload.delete({ collection: 'sessions', id: sessionId, overrideAccess: true }).catch(() => undefined)
  }
  if (raceSessionId != null) {
    const raceResa = await payload.find({
      collection: 'reservations',
      overrideAccess: true,
      limit: 20,
      where: { session: { equals: raceSessionId } },
    })
    for (const doc of raceResa.docs) {
      await payload.delete({ collection: 'reservations', id: doc.id, overrideAccess: true }).catch(() => undefined)
    }
    await payload.delete({ collection: 'sessions', id: raceSessionId, overrideAccess: true }).catch(() => undefined)
  }
  const straySessions = await payload.find({
    collection: 'sessions',
    overrideAccess: true,
    draft: true,
    limit: 50,
    where: { startsAt: { greater_than_equal: '2099-11-20T00:00:00.000Z' } },
  })
  for (const doc of straySessions.docs) {
    await payload.delete({ collection: 'sessions', id: doc.id, overrideAccess: true }).catch(() => undefined)
  }
  if (workshopId != null) {
    await payload.delete({ collection: 'workshops', id: workshopId, overrideAccess: true }).catch(() => undefined)
  }
  if (editorId != null) {
    await payload.delete({ collection: 'users', id: editorId, overrideAccess: true }).catch(() => undefined)
  }

  // Les quatre brouillons réels doivent rester
  const known = ['recolle-toi-meuf', 'pixel-kids', 'ma-croix-mes-couleurs', 'numero-de-maison']
  for (const knownSlug of known) {
    const found = await payload.find({
      collection: 'workshops',
      overrideAccess: true,
      draft: true,
      limit: 1,
      where: { slug: { equals: knownSlug } },
    })
    assert(found.totalDocs === 1, `Brouillon réel conservé : ${knownSlug}`)
  }

  const fake = await payload.find({
    collection: 'reservations',
    overrideAccess: true,
    limit: 20,
    where: { email: { contains: String(stamp) } },
  })
  assert(fake.totalDocs === 0, 'Aucune réservation de validation restante')

  await payload.destroy().catch(() => undefined)
}

console.log('\n--- Résultats validation lot 4A ---')
for (const line of results) console.log(line)
if (failures.length) {
  console.error('\nÉCHECS:')
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log('\nValidation lot 4A réussie')
process.exit(0)
