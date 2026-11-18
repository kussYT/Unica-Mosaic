import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { BookingForm } from '@/components/BookingForm'
import { ArrowLeft } from '@/components/Icons'
import { buildBookingQuote } from '@/lib/booking'
import { formatSessionWhen } from '@/lib/catalogue'
import { pageMeta } from '@/lib/meta'
import { stripeConfigured, stripeLiveKeyRejected } from '@/lib/stripe'
import '@/styles/booking.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = pageMeta(
  'Réserver un atelier',
  'Choisissez votre session, le nombre de participants et réglez l’acompte ou la totalité via Stripe.',
)

type Args = { searchParams: Promise<{ session?: string }> }

export default async function ReservePage({ searchParams }: Args) {
  const { session: sessionId } = await searchParams
  if (!sessionId) notFound()

  if (stripeLiveKeyRejected()) {
    return (
      <section className="section wrap booking-page">
        <h1>Paiement indisponible</h1>
        <p>Les clés Stripe live sont désactivées sur ce site.</p>
      </section>
    )
  }

  if (!stripeConfigured()) {
    return (
      <section className="section wrap booking-page">
        <div className="wrap breadcrumb">
          <a href="/#calendrier">
            <ArrowLeft /> Retour au calendrier
          </a>
        </div>
        <h1>Réservation bientôt disponible</h1>
        <p>
          Le parcours de paiement n’est pas encore branché (clé Stripe de test manquante). Les places ne sont pas
          retenues depuis cette page.
        </p>
      </section>
    )
  }

  try {
    const payload = await getPayload({ config })
    const quote = await buildBookingQuote(payload, sessionId, 1, 'deposit')
    return (
      <section className="section wrap booking-page">
        <div className="breadcrumb">
          <a href={`/ateliers/${quote.workshopSlug}/`}>
            <ArrowLeft /> {quote.workshopTitle}
          </a>
        </div>
        <div className="booking-layout">
          <div>
            <p className="eyebrow">RÉSERVATION</p>
            <h1>
              Réserver
              <br />
              <em>votre place.</em>
            </h1>
            <p>
              Les montants affichés viennent des tarifs publiés de l’atelier. Le paiement se poursuit sur Stripe
              Checkout, en mode test uniquement.
            </p>
          </div>
          <BookingForm
            session={{
              sessionId: String(quote.sessionId),
              workshopTitle: quote.workshopTitle,
              workshopSlug: quote.workshopSlug,
              whenLabel: formatSessionWhen(quote.startsAt, quote.endsAt),
              place: quote.place,
              remainingSeats: quote.remainingSeats,
              unitPriceCents: quote.unitPriceCents,
              unitDepositCents: quote.unitDepositCents,
            }}
          />
        </div>
      </section>
    )
  } catch {
    notFound()
  }
}
