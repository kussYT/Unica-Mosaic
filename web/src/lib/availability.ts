import type { Payload, Where } from 'payload'

export const HOLD_MINUTES = 15

export type SeatSnapshot = {
  capacity: number | null
  occupied: number
  remaining: number | null
  state: 'scheduled' | 'full' | 'cancelled'
}

type PgPool = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>>; rowCount?: number }>
}

const poolOf = (payload: Payload): PgPool | null => {
  const pool = (payload.db as { pool?: PgPool }).pool
  return pool?.query ? pool : null
}

const sessionIdOf = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === 'object' && 'id' in value) return sessionIdOf((value as { id: unknown }).id)
  return null
}

export const occupyingWhere = (sessionId: number | string, excludeId?: number | string): Where => {
  const now = new Date().toISOString()
  const clauses: Where[] = [
    { session: { equals: sessionId } },
    {
      or: [
        { status: { equals: 'confirmed' } },
        {
          and: [{ status: { equals: 'held' } }, { heldUntil: { greater_than: now } }],
        },
      ],
    },
  ]
  if (excludeId != null) clauses.push({ id: { not_equals: excludeId } })
  return { and: clauses }
}

export const occupiedFromDocs = (docs: Array<{ participants?: number | null }>) =>
  docs.reduce((sum, doc) => sum + (typeof doc.participants === 'number' ? doc.participants : 0), 0)

/** Expire les retenues dépassées en SQL, sans re-entrer dans les hooks Payload. */
export async function expireHolds(payload: Payload, sessionId?: number | string) {
  const pool = poolOf(payload)
  if (!pool) return 0
  const result = await pool.query(
    `UPDATE reservations
     SET status = 'expired',
         expired_at = COALESCE(expired_at, NOW()),
         updated_at = NOW()
     WHERE status = 'held'
       AND held_until IS NOT NULL
       AND held_until <= NOW()
       AND ($1::int IS NULL OR session_id = $1)`,
    [sessionId == null ? null : Number(sessionId)],
  )
  // L’état de session est resynchronisé par le déclencheur SQL AFTER UPDATE.
  return result.rowCount || 0
}

export async function getOccupiedSeats(
  payload: Payload,
  sessionId: number | string,
  excludeId?: number | string,
): Promise<number> {
  const result = await payload.find({
    collection: 'reservations',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    where: occupyingWhere(sessionId, excludeId),
  })
  return occupiedFromDocs(result.docs)
}

export async function getSeatSnapshot(payload: Payload, sessionId: number | string): Promise<SeatSnapshot | null> {
  const session = await payload.findByID({
    collection: 'sessions',
    id: sessionId,
    depth: 0,
    overrideAccess: true,
    context: { skipRemainingSeats: true },
  }).catch(() => null)
  if (!session) return null
  const capacity = typeof session.capacity === 'number' ? session.capacity : null
  const occupied = await getOccupiedSeats(payload, sessionId)
  const remaining = capacity == null ? null : Math.max(0, capacity - occupied)
  return {
    capacity,
    occupied,
    remaining,
    state: session.state,
  }
}

export async function getRemainingSeats(payload: Payload, sessionId: number | string): Promise<number | null> {
  const snapshot = await getSeatSnapshot(payload, sessionId)
  return snapshot?.remaining ?? null
}

export async function getRemainingSeatsBySessionIds(
  payload: Payload,
  sessionIds: Array<number | string>,
): Promise<Map<string, number | null>> {
  const unique = [...new Set(sessionIds.map(String))]
  const map = new Map<string, number | null>()
  if (unique.length === 0) return map

  await expireHolds(payload)

  const sessions = await payload.find({
    collection: 'sessions',
    depth: 0,
    limit: unique.length,
    overrideAccess: true,
    context: { skipRemainingSeats: true },
    where: { id: { in: unique } },
  })
  const capacityById = new Map(
    sessions.docs.map((doc) => [String(doc.id), typeof doc.capacity === 'number' ? doc.capacity : null]),
  )

  const reservations = await payload.find({
    collection: 'reservations',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    where: {
      and: [
        { session: { in: unique } },
        {
          or: [
            { status: { equals: 'confirmed' } },
            {
              and: [
                { status: { equals: 'held' } },
                { heldUntil: { greater_than: new Date().toISOString() } },
              ],
            },
          ],
        },
      ],
    },
  })

  const occupiedById = new Map<string, number>()
  for (const doc of reservations.docs) {
    const id = String(sessionIdOf(doc.session) ?? '')
    if (!id) continue
    occupiedById.set(id, (occupiedById.get(id) || 0) + (typeof doc.participants === 'number' ? doc.participants : 0))
  }

  for (const id of unique) {
    const capacity = capacityById.get(id) ?? null
    if (capacity == null) {
      map.set(id, null)
      continue
    }
    map.set(id, Math.max(0, capacity - (occupiedById.get(id) || 0)))
  }
  return map
}

export async function assertCanOccupy(
  payload: Payload,
  sessionId: number | string,
  participants: number,
  excludeId?: number | string,
) {
  if (!Number.isInteger(participants) || participants < 1) {
    throw new Error('Le nombre de participants doit être un entier supérieur à zéro.')
  }

  // Contrôle applicatif lisible. La non-survente concurrente est garantie par le
  // déclencheur PostgreSQL reservations_enforce_capacity (SELECT FOR UPDATE).
  const session = await payload.findByID({
    collection: 'sessions',
    id: sessionId,
    depth: 0,
    overrideAccess: true,
    context: { skipRemainingSeats: true },
  }).catch(() => null)
  if (!session) throw new Error('Session introuvable.')
  if (session.state === 'cancelled') throw new Error('Cette session est annulée.')
  if (typeof session.capacity !== 'number') {
    throw new Error('La capacité de la session n’est pas définie.')
  }
  const occupied = await getOccupiedSeats(payload, sessionId, excludeId)
  if (occupied + participants > session.capacity) {
    throw new Error('Plus assez de places disponibles pour cette session.')
  }
}

export async function syncSessionAvailability(payload: Payload, sessionId: number | string) {
  const snapshot = await getSeatSnapshot(payload, sessionId)
  if (!snapshot || snapshot.state === 'cancelled') return snapshot
  if (snapshot.capacity == null) return snapshot

  const nextState = snapshot.occupied >= snapshot.capacity ? 'full' : 'scheduled'
  if (nextState !== snapshot.state) {
    await payload.update({
      collection: 'sessions',
      id: sessionId,
      depth: 0,
      overrideAccess: true,
      context: { availabilitySync: true, skipRemainingSeats: true },
      data: { state: nextState },
    })
    snapshot.state = nextState
  }
  return snapshot
}

export const effectiveCalendarState = (
  state: 'scheduled' | 'full' | 'cancelled',
  remainingSeats: number | null,
): 'scheduled' | 'full' | 'cancelled' => {
  if (state === 'cancelled') return 'cancelled'
  // Les places calculées priment sur un état « complète » éventuellement périmé
  // (ex. capacité augmentée après remplissage).
  if (typeof remainingSeats === 'number') return remainingSeats > 0 ? 'scheduled' : 'full'
  return state === 'full' ? 'full' : 'scheduled'
}
