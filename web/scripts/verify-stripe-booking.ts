import { getPayload } from 'payload'
import Stripe from 'stripe'

import config from '../src/payload.config.ts'
import { computeBookingQuote } from '../src/lib/booking.ts'
import { processStripeEvent } from '../src/lib/stripe-fulfillment.ts'
import { stripeConfigured, stripeLiveKeyRejected } from '../src/lib/stripe.ts'
import { getRemainingSeats } from '../src/lib/availability.ts'

const failures: string[] = []
const assert = (condition: boolean, message: string) => {
  if (!condition) failures.push(message)
}

const deposit = computeBookingQuote({
  participants: 2,
  unitPriceCents: 4500,
  unitDepositCents: 1000,
  paymentChoice: 'deposit',
})
assert(deposit.totalCents === 9000, 'Total acompte 2 pers.')
assert(deposit.chargeNowCents === 2000, 'Charge acompte 2 pers.')
assert(deposit.balanceAfterCents === 7000, 'Solde acompte 2 pers.')

const full = computeBookingQuote({
  participants: 3,
  unitPriceCents: 4500,
  unitDepositCents: 1000,
  paymentChoice: 'full',
})
assert(full.chargeNowCents === 13500 && full.balanceAfterCents === 0, 'Paiement intégral 3 pers.')

assert(!stripeLiveKeyRejected() || !(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_'), 'Clé live détectée')

const stamp = Date.now()
const payload = await getPayload({ config })
let workshopId: number | string | null = null
let sessionId: number | string | null = null
const reservationIds: Array<number | string> = []

try {
  const workshop = await payload.create({
    collection: 'workshops',
    overrideAccess: true,
    data: {
      title: 'Stripe lot 4B',
      slug: `stripe-4b-${stamp}`,
      summary: 'Contrôle',
      description: 'Contrôle',
      priceCents: 5000,
      depositCents: 1500,
      _status: 'published',
    },
  })
  workshopId = workshop.id

  const session = await payload.create({
    collection: 'sessions',
    overrideAccess: true,
    data: {
      workshop: workshop.id,
      startsAt: '2099-12-10T09:00:00.000Z',
      endsAt: '2099-12-10T12:00:00.000Z',
      capacity: 2,
      state: 'scheduled',
      _status: 'published',
    },
  })
  sessionId = session.id

  const held = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Hold',
      lastName: 'Stripe',
      email: `hold-stripe-${stamp}@unica.local`,
      participants: 1,
      status: 'held',
      origin: 'online',
      paymentMode: 'deposit',
      paymentStatus: 'pending',
      totalCents: 5000,
      depositCents: 1500,
      paidCents: 0,
      heldUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
      stripeCheckoutSessionId: `cs_test_fake_${stamp}`,
    },
  })
  reservationIds.push(held.id)
  assert((await getRemainingSeats(payload, session.id)) === 1, 'Retenue Stripe occupe 1 place')

  // Webhook dupliqué (idempotence table)
  const fakeEvent = {
    id: `evt_test_${stamp}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_test_fake_${stamp}`,
        object: 'checkout.session',
        amount_total: 1500,
        payment_status: 'paid',
        status: 'complete',
        payment_intent: `pi_test_${stamp}`,
        metadata: { reservationId: String(held.id) },
      },
    },
  } as unknown as Stripe.Event

  const first = await processStripeEvent(payload, fakeEvent)
  assert(!('duplicate' in first && first.duplicate), 'Premier webhook doit passer')
  const confirmed = await payload.findByID({ collection: 'reservations', id: held.id, overrideAccess: true })
  assert(confirmed.status === 'confirmed', 'Réservation confirmée après webhook')
  assert(confirmed.paidCents === 1500, 'paidCents = acompte encaissé')
  assert(confirmed.balanceCents === 3500, 'Solde restant exact')
  assert(confirmed.paymentStatus === 'paid', 'paymentStatus paid')

  const second = await processStripeEvent(payload, fakeEvent)
  assert('duplicate' in second && second.duplicate, 'Webhook dupliqué ignoré')
  const again = await payload.findByID({ collection: 'reservations', id: held.id, overrideAccess: true })
  assert(again.paidCents === 1500, 'Pas de double encaissement')

  // Annulation manuelle libère
  const manual = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: session.id,
      firstName: 'Manuel',
      lastName: 'Annule',
      email: `manuel-${stamp}@unica.local`,
      participants: 1,
      status: 'confirmed',
      origin: 'manual',
      paymentMode: 'none',
      paymentStatus: 'unpaid',
      totalCents: 5000,
      paidCents: 0,
    },
  })
  reservationIds.push(manual.id)
  assert((await getRemainingSeats(payload, session.id)) === 0, 'Session pleine après manuel')
  await payload.update({
    collection: 'reservations',
    id: manual.id,
    overrideAccess: true,
    data: { status: 'cancelled' },
  })
  assert((await getRemainingSeats(payload, session.id)) === 1, 'Annulation manuelle libère la place')
  assert(manual.paymentStatus === 'unpaid' && manual.paidCents === 0, 'Manuel non présenté comme payé')

  if (stripeConfigured()) {
    console.log('Stripe test configuré : parcours Checkout réel à valider via stripe listen + carte 4242.')
  } else {
    console.log('Stripe test non configuré : calculs, webhook idempotent et places validés sans appel réseau.')
  }
} finally {
  for (const id of reservationIds) {
    await payload.delete({ collection: 'reservations', id, overrideAccess: true }).catch(() => undefined)
  }
  if (sessionId != null) {
    await payload.delete({ collection: 'sessions', id: sessionId, overrideAccess: true }).catch(() => undefined)
  }
  if (workshopId != null) {
    await payload.delete({ collection: 'workshops', id: workshopId, overrideAccess: true }).catch(() => undefined)
  }
  await payload.destroy().catch(() => undefined)
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Réservation Stripe (lot 4B) vérifiée')
process.exit(0)
