import type { Metadata } from 'next'
import { getPayload } from 'payload'

import config from '@payload-config'
import { formatEuros } from '@/lib/calendar'
import { pageMeta } from '@/lib/meta'
import { confirmPaidReservation, findReservationByCheckout } from '@/lib/stripe-fulfillment'
import { getStripe, stripeConfigured } from '@/lib/stripe'
import '@/styles/booking.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = pageMeta(
  'Confirmation de réservation',
  'Résultat de votre paiement pour un atelier UNICA.',
)

type Args = { searchParams: Promise<{ session_id?: string }> }

export default async function ReservationReturnPage({ searchParams }: Args) {
  const { session_id: checkoutId } = await searchParams

  if (!checkoutId || !stripeConfigured()) {
    return (
      <section className="section wrap booking-page">
        <h1>Paiement en cours de vérification</h1>
        <p>
          Nous n’avons pas pu relier cette page à un paiement Stripe. Si vous avez réglé, la confirmation arrivera
          dès réception du webhook — ne payez pas une seconde fois.
        </p>
      </section>
    )
  }

  const stripe = getStripe()
  const checkout = await stripe.checkout.sessions.retrieve(checkoutId)
  const payload = await getPayload({ config })

  // La page de retour n’est qu’un miroir : la confirmation officielle passe par le webhook.
  // On tente une réconciliation défensive si le webhook n’est pas encore arrivé.
  if (checkout.payment_status === 'paid' || checkout.payment_status === 'no_payment_required') {
    await confirmPaidReservation(payload, checkout).catch(() => null)
  }

  const reservation = await findReservationByCheckout(payload, checkout)
  const paid = typeof checkout.amount_total === 'number' ? checkout.amount_total : reservation?.paidCents || 0
  const balance =
    typeof reservation?.balanceCents === 'number'
      ? reservation.balanceCents
      : Math.max(0, (reservation?.totalCents || 0) - paid)

  const confirmed =
    reservation?.status === 'confirmed' ||
    checkout.payment_status === 'paid' ||
    checkout.payment_status === 'no_payment_required'

  return (
    <section className="section wrap booking-page">
      <p className="eyebrow">RÉSERVATION</p>
      <h1>{confirmed ? 'Merci' : 'Paiement reçu'}</h1>
      {confirmed ? (
        <>
          <p>Votre réservation est enregistrée. Un e-mail de confirmation sera envoyé lorsque le service d’envoi sera branché.</p>
          <ul className="booking-result">
            <li>Référence interne : {reservation?.id ?? '—'}</li>
            <li>Montant réglé en ligne : {formatEuros(paid)}</li>
            <li>
              {balance > 0 ? `Solde à régler sur place : ${formatEuros(balance)}` : 'Aucun solde sur place'}
            </li>
            {reservation?.paymentStatus === 'exception' ? (
              <li>Attention : une réconciliation manuelle est nécessaire. Marie a été alertée dans l’admin.</li>
            ) : null}
          </ul>
        </>
      ) : (
        <p>
          Le paiement n’est pas encore confirmé côté atelier. Si vous avez finalisé Stripe, patientez quelques
          instants — la confirmation repose sur le webhook, pas uniquement sur cette page.
        </p>
      )}
      <p>
        <a className="button" href="/#calendrier">
          Retour au calendrier
        </a>
      </p>
    </section>
  )
}
