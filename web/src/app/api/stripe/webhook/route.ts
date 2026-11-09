import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import config from '@payload-config'
import { processStripeEvent } from '@/lib/stripe-fulfillment'
import { getStripe, stripeConfigured, stripeLiveKeyRejected } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (stripeLiveKeyRejected()) {
    return NextResponse.json({ error: 'Clé live refusée.' }, { status: 503 })
  }
  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré.' }, { status: 503 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!secret.startsWith('whsec_')) {
    return NextResponse.json({ error: 'Secret webhook manquant.' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Signature absente.' }, { status: 400 })
  }

  const rawBody = await request.text()
  let event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (error) {
    console.error('Webhook signature', error)
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await processStripeEvent(payload, event)
    return NextResponse.json({ received: true, result })
  } catch (error) {
    console.error('Webhook processing', error)
    return NextResponse.json({ error: 'Traitement impossible.' }, { status: 500 })
  }
}
