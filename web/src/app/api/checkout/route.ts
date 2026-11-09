import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import config from '@payload-config'
import { createCheckoutBooking, type PaymentChoice } from '@/lib/booking'
import { stripeConfigured, stripeLiveKeyRejected } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  sessionId?: number | string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  participants?: number
  paymentChoice?: PaymentChoice
}

export async function POST(request: Request) {
  if (stripeLiveKeyRejected()) {
    return NextResponse.json({ error: 'Les clés Stripe live sont interdites.' }, { status: 503 })
  }
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: 'Le paiement en ligne n’est pas encore configuré (clé Stripe de test manquante).' },
      { status: 503 },
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const participants = Number(body.participants)
  const paymentChoice = body.paymentChoice === 'full' ? 'full' : body.paymentChoice === 'deposit' ? 'deposit' : null
  if (!body.sessionId || !paymentChoice) {
    return NextResponse.json({ error: 'Session et mode de paiement requis.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await createCheckoutBooking(payload, {
      sessionId: body.sessionId,
      firstName: String(body.firstName || ''),
      lastName: String(body.lastName || ''),
      email: String(body.email || ''),
      phone: body.phone ? String(body.phone) : '',
      participants,
      paymentChoice,
    })
    return NextResponse.json({
      url: result.checkoutUrl,
      reservationId: result.reservationId,
      chargeNowCents: result.quote.chargeNowCents,
      balanceAfterCents: result.quote.balanceAfterCents,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Réservation impossible.'
    console.error('checkout', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
