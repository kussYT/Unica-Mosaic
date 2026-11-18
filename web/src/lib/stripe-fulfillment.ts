import type { Payload } from 'payload'
import type Stripe from 'stripe'

import { formatMoney, sendBookingEmails } from '@/lib/mail'
import { getStripe, stripeConfigured } from '@/lib/stripe'

const parisWhen = (startsAt: string, endsAt: string) => {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const day = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start)
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(start)
  const endTime = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(end)
  return `${day}, ${time} – ${endTime}`
}

export async function markStripeEventProcessed(payload: Payload, eventId: string, type: string) {
  const pool = (payload.db as { pool?: { query: (text: string, params?: unknown[]) => Promise<{ rowCount?: number }> } }).pool
  if (!pool) return false
  try {
    const result = await pool.query(
      `INSERT INTO stripe_webhook_events (event_id, event_type, processed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      [eventId, type],
    )
    return Boolean(result.rowCount)
  } catch {
    return false
  }
}

export async function findReservationByCheckout(
  payload: Payload,
  checkoutSession: Stripe.Checkout.Session,
) {
  const byMeta = checkoutSession.metadata?.reservationId
  if (byMeta) {
    const doc = await payload.findByID({
      collection: 'reservations',
      id: byMeta,
      depth: 1,
      overrideAccess: true,
    }).catch(() => null)
    if (doc) return doc
  }
  const found = await payload.find({
    collection: 'reservations',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    where: { stripeCheckoutSessionId: { equals: checkoutSession.id } },
  })
  return found.docs[0] || null
}

export async function confirmPaidReservation(
  payload: Payload,
  checkoutSession: Stripe.Checkout.Session,
) {
  const reservation = await findReservationByCheckout(payload, checkoutSession)
  if (!reservation) {
    throw new Error(`Réservation introuvable pour ${checkoutSession.id}`)
  }

  const paidCents = typeof checkoutSession.amount_total === 'number' ? checkoutSession.amount_total : 0
  const paymentIntent =
    typeof checkoutSession.payment_intent === 'string'
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id || null

  if (reservation.status === 'confirmed' && reservation.paymentStatus === 'paid') {
    if (reservation.stripePaymentIntentId && paymentIntent && reservation.stripePaymentIntentId === paymentIntent) {
      return { reservation, alreadyConfirmed: true as const }
    }
    if (reservation.paidCents === paidCents) {
      return { reservation, alreadyConfirmed: true as const }
    }
  }

  if (reservation.status === 'cancelled' || reservation.status === 'expired') {
    const updated = await payload.update({
      collection: 'reservations',
      id: reservation.id,
      overrideAccess: true,
      context: { skipCapacityGuard: true },
      data: {
        paymentStatus: 'exception',
        stripeCheckoutSessionId: checkoutSession.id,
        stripePaymentIntentId: paymentIntent || reservation.stripePaymentIntentId,
        adminNote: [
          reservation.adminNote,
          `Exception : paiement Stripe reçu (${formatMoney(paidCents)}) alors que la réservation était ${reservation.status}. Réconciliation manuelle requise.`,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    })
    return { reservation: updated, exception: true as const }
  }

  const total = typeof reservation.totalCents === 'number' ? reservation.totalCents : paidCents
  const nextPaid = Math.min(total, Math.max(0, paidCents))

  try {
    const updated = await payload.update({
      collection: 'reservations',
      id: reservation.id,
      overrideAccess: true,
      data: {
        status: 'confirmed',
        paymentStatus: 'paid',
        paidCents: nextPaid,
        balanceCents: Math.max(0, total - nextPaid),
        confirmedAt: reservation.confirmedAt || new Date().toISOString(),
        stripeCheckoutSessionId: checkoutSession.id,
        stripePaymentIntentId: paymentIntent,
      },
    })

    if (!reservation.confirmationEmailSentAt) {
      const session = typeof updated.session === 'object' && updated.session ? updated.session : null
      const workshop =
        session && typeof session.workshop === 'object' && session.workshop ? session.workshop : null
      const mail = await sendBookingEmails({
        toCustomer: updated.email,
        customerName: `${updated.firstName} ${updated.lastName}`,
        workshopTitle: workshop?.title || 'Atelier UNICA',
        whenLabel:
          session?.startsAt && session?.endsAt
            ? parisWhen(String(session.startsAt), String(session.endsAt))
            : 'Date à confirmer',
        participants: updated.participants,
        paidCents: nextPaid,
        balanceCents: Math.max(0, total - nextPaid),
        practicalInfo: workshop?.practicalInfo || session?.place || null,
      })
      await payload.update({
        collection: 'reservations',
        id: updated.id,
        overrideAccess: true,
        context: { skipCapacityGuard: true },
        data: {
          confirmationEmailSentAt: new Date().toISOString(),
          adminNote: [
            updated.adminNote,
            !mail.customer.sent ? `E-mail client non envoyé : ${mail.customer.reason}` : null,
            !mail.staff.sent ? `Notification Marie non envoyée : ${mail.staff.reason}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      })
    }

    return { reservation: updated, alreadyConfirmed: false as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de confirmation'
    const updated = await payload.update({
      collection: 'reservations',
      id: reservation.id,
      overrideAccess: true,
      context: { skipCapacityGuard: true },
      data: {
        paymentStatus: 'exception',
        stripeCheckoutSessionId: checkoutSession.id,
        stripePaymentIntentId: paymentIntent,
        adminNote: [
          reservation.adminNote,
          `Exception : paiement reçu (${formatMoney(paidCents)}) mais confirmation impossible (${message}).`,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    })
    return { reservation: updated, exception: true as const }
  }
}

export async function expireCheckoutReservation(
  payload: Payload,
  checkoutSession: Stripe.Checkout.Session,
) {
  const reservation = await findReservationByCheckout(payload, checkoutSession)
  if (!reservation) return null

  if (checkoutSession.status === 'complete' && checkoutSession.payment_status === 'paid') {
    return confirmPaidReservation(payload, checkoutSession)
  }

  if (reservation.status === 'confirmed') return { reservation, alreadyConfirmed: true as const }
  if (reservation.status === 'expired' || reservation.status === 'cancelled') {
    return { reservation, alreadyConfirmed: true as const }
  }

  const updated = await payload.update({
    collection: 'reservations',
    id: reservation.id,
    overrideAccess: true,
    context: { skipCapacityGuard: true },
    data: {
      status: 'expired',
      paymentStatus: reservation.paymentStatus === 'paid' ? reservation.paymentStatus : 'failed',
      expiredAt: new Date().toISOString(),
    },
  })
  return { reservation: updated, expired: true as const }
}

/** Avant de libérer une retenue échue : interroger Stripe si une session Checkout existe. */
export async function reconcileHeldReservation(payload: Payload, reservation: {
  id: number | string
  status?: string | null
  heldUntil?: string | null
  stripeCheckoutSessionId?: string | null
}) {
  if (reservation.status !== 'held') return null
  const checkoutId = reservation.stripeCheckoutSessionId
  if (!checkoutId) {
    if (reservation.heldUntil && new Date(reservation.heldUntil).getTime() <= Date.now()) {
      return payload.update({
        collection: 'reservations',
        id: reservation.id,
        overrideAccess: true,
        context: { skipCapacityGuard: true },
        data: { status: 'expired', expiredAt: new Date().toISOString(), paymentStatus: 'failed' },
      })
    }
    return null
  }

  if (!stripeConfigured()) {
    console.warn('Retenue Stripe échue : clé de test absente, place conservée jusqu’à réconciliation.', reservation.id)
    return null
  }

  const stripe = getStripe()
  const checkout = await stripe.checkout.sessions.retrieve(checkoutId)

  if (checkout.status === 'complete' && (checkout.payment_status === 'paid' || checkout.payment_status === 'no_payment_required')) {
    return (await confirmPaidReservation(payload, checkout)).reservation
  }

  if (checkout.status === 'open') {
    const expiresAt = checkout.expires_at
      ? new Date(checkout.expires_at * 1000).toISOString()
      : reservation.heldUntil
    if (expiresAt && expiresAt !== reservation.heldUntil) {
      return payload.update({
        collection: 'reservations',
        id: reservation.id,
        overrideAccess: true,
        context: { skipCapacityGuard: true },
        data: { heldUntil: expiresAt },
      })
    }
    return null
  }

  if (checkout.payment_status === 'unpaid' && checkout.status === 'expired') {
    return (await expireCheckoutReservation(payload, checkout))?.reservation || null
  }

  // Paiement asynchrone éventuel encore en cours : ne pas libérer.
  if (checkout.payment_status === 'unpaid' && checkout.status === 'complete') {
    return payload.update({
      collection: 'reservations',
      id: reservation.id,
      overrideAccess: true,
      context: { skipCapacityGuard: true },
      data: {
        paymentStatus: 'pending',
        adminNote: 'Paiement Checkout terminé côté session, statut unpaid — attente événement asynchrone.',
      },
    })
  }

  return null
}

export async function processStripeEvent(payload: Payload, event: Stripe.Event) {
  const inserted = await markStripeEventProcessed(payload, event.id, event.type)
  if (!inserted) {
    return { duplicate: true as const }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        return confirmPaidReservation(payload, session)
      }
      return { pendingAsync: true as const, session }
    }
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session
      return confirmPaidReservation(payload, session)
    }
    case 'checkout.session.async_payment_failed': {
      const session = event.data.object as Stripe.Checkout.Session
      return expireCheckoutReservation(payload, session)
    }
    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      return expireCheckoutReservation(payload, session)
    }
    default:
      return { ignored: true as const, type: event.type }
  }
}
