import assert from 'node:assert/strict'
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { buildBookingQuote } from '../src/lib/booking.ts'
import { dayAvailability, parisDayKey } from '../src/lib/calendar.ts'
import { getCalendarSessions } from '../src/lib/catalogue.ts'

const database = new URL(process.env.DATABASE_URL || 'postgres://invalid')
if (
  !['127.0.0.1', 'localhost'].includes(database.hostname) ||
  database.port !== '5433' ||
  database.pathname !== '/unica_mosaic_local' ||
  process.env.UNICA_RUNTIME === 'preview'
) {
  throw new Error('Démonstration autorisée uniquement sur la base UNICA locale.')
}

const examples = [
  { name: 'Dimanche Mosaïque', slug: 'dimanche-mosaique', price: 3500, deposit: 1500, duration: 90, weekday: 0, elapsed: 1 },
  { name: 'Recolle-toi meuf — Afterwork', slug: 'recolle-afterwork', price: 4500, deposit: 2000, duration: 90, weekday: 4, elapsed: 1 },
  { name: 'Ma croix, mes couleurs', slug: 'ma-croix', price: 6000, deposit: 3000, duration: 120, weekday: 6, elapsed: 1 },
  { name: 'Numéro de maison', slug: 'numero-maison', price: 6000, deposit: 3000, duration: 120, weekday: 6, elapsed: 8 },
  { name: 'ADO Pixel / Mosaic', slug: 'ado-pixel', price: 3500, deposit: 1500, duration: 90, weekday: 3, elapsed: 1 },
]

const payload = await getPayload({ config })
try {
  for (const example of examples) {
    const slug = 'demo-calendrier-' + example.slug
    const starts = new Date()
    starts.setUTCHours(example.weekday === 4 ? 17 : 13, 0, 0, 0)
    starts.setUTCDate(starts.getUTCDate() + example.elapsed)
    while (starts.getUTCDay() !== example.weekday) starts.setUTCDate(starts.getUTCDate() + 1)
    const startsAt = starts.toISOString()
    const endsAt = new Date(starts.getTime() + example.duration * 60_000).toISOString()
    const existing = await payload.find({ collection: 'workshops', where: { slug: { equals: slug } }, limit: 1 })
    const workshop = existing.docs[0] ?? await payload.create({
      collection: 'workshops',
      data: {
        title: example.name + ' · Démo',
        slug,
        label: 'SESSION DE TEST',
        summary: 'Exemple local pour vérifier le calendrier et les tarifs.',
        description: 'Session de démonstration. Date, horaire et capacité fictifs.',
        priceCents: example.price,
        depositCents: example.deposit,
        durationMinutes: example.duration,
        _status: 'published',
      },
    })
    const future = await payload.find({
      collection: 'sessions',
      where: { and: [{ workshop: { equals: workshop.id } }, { startsAt: { greater_than_equal: new Date().toISOString() } }] },
      limit: 1,
    })
    const session = future.docs[0] ?? await payload.create({
      collection: 'sessions',
      data: {
        workshop: workshop.id,
        startsAt,
        endsAt,
        capacity: 8,
        state: 'scheduled',
        _status: 'published',
      },
    })
    const event = (await getCalendarSessions()).find((item) => String(item.id) === String(session.id))
    assert.ok(event, 'Atelier absent du calendrier : ' + example.name)
    assert.equal(event.priceCents, example.price)
    assert.equal(event.depositCents, example.deposit)
    assert.equal(event.capacity, 8)
    assert.ok(typeof event.remainingSeats === 'number' && event.remainingSeats >= 0 && event.remainingSeats <= 8)
    assert.equal(dayAvailability([event]), event.remainingSeats > 0 ? 'open' : 'full')
    if (example.weekday === 0) {
      assert.equal(new Date(parisDayKey(event.startsAt) + 'T12:00:00Z').getUTCDay(), 0)
    }
    if (event.remainingSeats > 0) {
      assert.equal((await buildBookingQuote(payload, session.id, 1, 'deposit')).chargeNowCents, example.deposit)
      assert.equal((await buildBookingQuote(payload, session.id, 1, 'full')).chargeNowCents, example.price)
    }
    console.log(parisDayKey(event.startsAt), example.name, event.remainingSeats + '/8 places')
  }
} finally {
  await payload.destroy()
}

process.exit(0)
