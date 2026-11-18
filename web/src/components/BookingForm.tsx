'use client'

import { useMemo, useState, type FormEvent } from 'react'

import { formatEuros } from '@/lib/calendar'

type PaymentChoice = 'deposit' | 'full'

export type BookingFormSession = {
  sessionId: string
  workshopTitle: string
  workshopSlug: string
  whenLabel: string
  place: string | null
  remainingSeats: number
  unitPriceCents: number
  unitDepositCents: number
}

export function BookingForm({ session }: { session: BookingFormSession }) {
  const [participants, setParticipants] = useState(1)
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('deposit')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const quote = useMemo(() => {
    const totalCents = session.unitPriceCents * participants
    const depositCents = session.unitDepositCents * participants
    const chargeNowCents = paymentChoice === 'full' ? totalCents : depositCents
    return {
      totalCents,
      depositCents,
      chargeNowCents,
      balanceAfterCents: Math.max(0, totalCents - chargeNowCents),
    }
  }, [participants, paymentChoice, session.unitDepositCents, session.unitPriceCents])

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          firstName,
          lastName,
          email,
          phone,
          participants,
          paymentChoice,
        }),
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Le paiement n’a pas pu démarrer.')
      }
      window.location.href = data.url
    } catch (err) {
      setPending(false)
      setError(err instanceof Error ? err.message : 'Le paiement n’a pas pu démarrer.')
    }
  }

  return (
    <form className="booking-form" onSubmit={onSubmit} noValidate>
      <div className="booking-summary" aria-live="polite">
        <p className="eyebrow">RÉCAPITULATIF</p>
        <h2>{session.workshopTitle}</h2>
        <p>{session.whenLabel}</p>
        {session.place ? <p>{session.place}</p> : null}
        <ul>
          <li>{participants} participant{participants > 1 ? 's' : ''}</li>
          <li>Prix total {formatEuros(quote.totalCents)}</li>
          <li>À régler maintenant {formatEuros(quote.chargeNowCents)}</li>
          <li>
            {quote.balanceAfterCents > 0
              ? `Solde sur place ${formatEuros(quote.balanceAfterCents)}`
              : 'Aucun solde sur place'}
          </li>
          <li>{session.remainingSeats} place{session.remainingSeats > 1 ? 's' : ''} encore disponible{session.remainingSeats > 1 ? 's' : ''}</li>
        </ul>
      </div>

      <label>
        Nombre de participants
        <select
          name="participants"
          value={participants}
          onChange={(event) => setParticipants(Number(event.target.value))}
          required
        >
          {Array.from({ length: session.remainingSeats }, (_, index) => index + 1).map((value) => (
            <option value={value} key={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend>Paiement</legend>
        <label className="booking-choice">
          <input
            type="radio"
            name="paymentChoice"
            value="deposit"
            checked={paymentChoice === 'deposit'}
            onChange={() => setPaymentChoice('deposit')}
          />
          <span>
            Acompte maintenant ({formatEuros(session.unitDepositCents)} / personne)
            <small>Solde à régler sur place le jour de l’atelier.</small>
          </span>
        </label>
        <label className="booking-choice">
          <input
            type="radio"
            name="paymentChoice"
            value="full"
            checked={paymentChoice === 'full'}
            onChange={() => setPaymentChoice('full')}
          />
          <span>
            Intégralité maintenant ({formatEuros(session.unitPriceCents)} / personne)
            <small>Aucun solde restant sur place.</small>
          </span>
        </label>
      </fieldset>

      <div className="booking-grid">
        <label>
          Prénom
          <input
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={80}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label>
          Nom
          <input
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={80}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
      </div>
      <label>
        E-mail
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={200}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        Téléphone
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          maxLength={40}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </label>

      {error ? (
        <p className="booking-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="button" type="submit" disabled={pending}>
        {pending ? 'Redirection vers le paiement…' : 'Continuer vers le paiement sécurisé'}
      </button>
      <p className="form-privacy">
        Paiement par carte via Stripe Checkout. Aucun compte client n’est créé. Les places sont retenues pendant 30 minutes le temps du paiement.
      </p>
    </form>
  )
}
