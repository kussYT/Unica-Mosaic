import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { pageMeta } from '@/lib/meta'
import { expireCheckoutReservation } from '@/lib/stripe-fulfillment'
import { getStripe, stripeConfigured } from '@/lib/stripe'
import '@/styles/booking.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = pageMeta(
  'Paiement annulé',
  'Vous avez quitté Stripe Checkout avant la fin du paiement.',
)

type Args = { searchParams: Promise<{ reservation?: string }> }

export default async function ReservationCancelPage({ searchParams }: Args) {
  const { reservation: reservationId } = await searchParams

  if (reservationId && stripeConfigured()) {
    try {
      const payload = await getPayload({ config })
      const doc = await payload.findByID({
        collection: 'reservations',
        id: reservationId,
        depth: 0,
        overrideAccess: true,
      })
      if (doc?.stripeCheckoutSessionId && doc.status === 'held') {
        const checkout = await getStripe().checkout.sessions.retrieve(doc.stripeCheckoutSessionId)
        if (checkout.status === 'open') {
          await getStripe().checkout.sessions.expire(doc.stripeCheckoutSessionId)
        }
        await expireCheckoutReservation(payload, checkout)
      }
    } catch (error) {
      console.error('Annulation checkout', error)
    }
  }

  return (
    <section className="section wrap booking-page">
      <p className="eyebrow">RÉSERVATION</p>
      <h1>Paiement non finalisé</h1>
      <p>
        Aucun montant n’a été encaissé. La retenue de places est libérée dès que Stripe confirme l’expiration de la
        session de paiement.
      </p>
      <p>
        <a className="button" href="/#calendrier">
          Choisir une autre date
        </a>
      </p>
    </section>
  )
}
