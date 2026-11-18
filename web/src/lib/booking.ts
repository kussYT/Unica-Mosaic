import type { Payload } from 'payload'

import { assertCanOccupy, getRemainingSeats } from '@/lib/availability'
import { CHECKOUT_HOLD_MINUTES, getStripe, siteUrl } from '@/lib/stripe'

export type PaymentChoice = 'deposit' | 'full'

export type BookingQuote = {
  sessionId: number | string
  workshopTitle: string
  workshopSlug: string
  startsAt: string
  endsAt: string
  place: string | null
  participants: number
  unitPriceCents: number
  unitDepositCents: number
  totalCents: number
  depositCents: number
  chargeNowCents: number
  balanceAfterCents: number
  remainingSeats: number
}

export type BookingInput = {
  sessionId: number | string
  firstName: string
  lastName: string
  email: string
  phone?: string
  participants: number
  paymentChoice: PaymentChoice
}

const asId = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return null
}

export const computeBookingQuote = (args: {
  participants: number
  unitPriceCents: number
  unitDepositCents: number
  paymentChoice: PaymentChoice
}) => {
  const { participants, unitPriceCents, unitDepositCents, paymentChoice } = args
  if (!Number.isInteger(participants) || participants < 1) {
    throw new Error('Le nombre de participants doit être un entier supérieur à zéro.')
  }
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    throw new Error('Le tarif de l’atelier n’est pas valide.')
  }
  if (!Number.isInteger(unitDepositCents) || unitDepositCents < 0 || unitDepositCents > unitPriceCents) {
    throw new Error('L’acompte de l’atelier n’est pas valide.')
  }
  const totalCents = unitPriceCents * participants
  const depositCents = unitDepositCents * participants
  const chargeNowCents = paymentChoice === 'full' ? totalCents : depositCents
  if (chargeNowCents < 1) {
    throw new Error('Le montant à payer en ligne doit être supérieur à zéro.')
  }
  return {
    totalCents,
    depositCents,
    chargeNowCents,
    balanceAfterCents: Math.max(0, totalCents - chargeNowCents),
  }
}

export async function buildBookingQuote(
  payload: Payload,
  sessionId: number | string,
  participants: number,
  paymentChoice: PaymentChoice,
): Promise<BookingQuote> {
  const session = await payload.findByID({
    collection: 'sessions',
    id: sessionId,
    depth: 1,
    overrideAccess: true,
    context: { skipRemainingSeats: true },
  })
  if (!session || session._status !== 'published') {
    throw new Error('Cette session n’est pas disponible à la réservation.')
  }
  if (session.state === 'cancelled') throw new Error('Cette session est annulée.')
  if (session.state === 'full') throw new Error('Cette session est complète.')
  if (typeof session.capacity !== 'number') throw new Error('La capacité de la session n’est pas définie.')

  const workshop = typeof session.workshop === 'object' && session.workshop ? session.workshop : null
  if (!workshop || workshop._status !== 'published') {
    throw new Error('L’atelier lié n’est pas publié.')
  }
  if (typeof workshop.priceCents !== 'number' || typeof workshop.depositCents !== 'number') {
    throw new Error('Le tarif de cet atelier n’est pas encore confirmé.')
  }

  const remainingSeats = await getRemainingSeats(payload, session.id)
  if (remainingSeats == null || remainingSeats < 1) {
    throw new Error('Il ne reste plus de places pour cette session.')
  }
  if (participants > remainingSeats) {
    throw new Error(`Il ne reste que ${remainingSeats} place${remainingSeats > 1 ? 's' : ''}.`)
  }

  const money = computeBookingQuote({
    participants,
    unitPriceCents: workshop.priceCents,
    unitDepositCents: workshop.depositCents,
    paymentChoice,
  })

  return {
    sessionId: session.id,
    workshopTitle: workshop.title,
    workshopSlug: workshop.slug,
    startsAt: String(session.startsAt),
    endsAt: String(session.endsAt),
    place: session.place || null,
    participants,
    unitPriceCents: workshop.priceCents,
    unitDepositCents: workshop.depositCents,
    remainingSeats,
    ...money,
  }
}

export async function createCheckoutBooking(payload: Payload, input: BookingInput) {
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone?.trim() || ''
  if (!firstName || !lastName || !email) throw new Error('Nom, prénom et e-mail sont obligatoires.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('L’adresse e-mail n’est pas valide.')

  const quote = await buildBookingQuote(payload, input.sessionId, input.participants, input.paymentChoice)
  await assertCanOccupy(payload, quote.sessionId, quote.participants)

  const heldUntil = new Date(Date.now() + CHECKOUT_HOLD_MINUTES * 60_000).toISOString()
  const reservation = await payload.create({
    collection: 'reservations',
    overrideAccess: true,
    data: {
      session: Number(quote.sessionId),
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      participants: quote.participants,
      status: 'held',
      origin: 'online',
      paymentMode: input.paymentChoice,
      paymentStatus: 'pending',
      totalCents: quote.totalCents,
      depositCents: quote.depositCents,
      paidCents: 0,
      balanceCents: quote.totalCents,
      heldUntil,
    },
  })

  try {
    const stripe = getStripe()
    const expiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_HOLD_MINUTES * 60
    const checkout = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        expires_at: expiresAt,
        success_url: `${siteUrl()}/reservation/retour?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl()}/reservation/annulation?reservation=${reservation.id}`,
        customer_email: email,
        client_reference_id: String(reservation.id),
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: quote.chargeNowCents,
              product_data: {
                name:
                  input.paymentChoice === 'full'
                    ? `Atelier ${quote.workshopTitle} — paiement intégral`
                    : `Atelier ${quote.workshopTitle} — acompte`,
                description: `${quote.participants} participant${quote.participants > 1 ? 's' : ''} · solde sur place ${quote.balanceAfterCents / 100} €`,
              },
            },
          },
        ],
        metadata: {
          reservationId: String(reservation.id),
          sessionId: String(quote.sessionId),
          paymentChoice: input.paymentChoice,
          participants: String(quote.participants),
        },
        payment_intent_data: {
          metadata: {
            reservationId: String(reservation.id),
            sessionId: String(quote.sessionId),
          },
        },
      },
      { idempotencyKey: `unica-checkout-${reservation.id}` },
    )

    if (!checkout.url) throw new Error('Stripe n’a pas renvoyé d’URL de paiement.')

    await payload.update({
      collection: 'reservations',
      id: reservation.id,
      overrideAccess: true,
      context: { skipCapacityGuard: true },
      data: {
        stripeCheckoutSessionId: checkout.id,
        heldUntil: new Date(expiresAt * 1000).toISOString(),
      },
    })

    return { reservationId: reservation.id, checkoutUrl: checkout.url, checkoutSessionId: checkout.id, quote }
  } catch (error) {
    await payload.update({
      collection: 'reservations',
      id: reservation.id,
      overrideAccess: true,
      context: { skipCapacityGuard: true },
      data: {
        status: 'cancelled',
        paymentStatus: 'failed',
        cancelledAt: new Date().toISOString(),
        adminNote: 'Annulée automatiquement : échec de création Stripe Checkout.',
      },
    })
    throw error
  }
}

export async function loadBookableSession(payload: Payload, sessionId: number | string) {
  return buildBookingQuote(payload, sessionId, 1, 'deposit')
}

export { asId }
