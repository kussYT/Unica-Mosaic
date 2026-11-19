import { formatSessionWhen, type PublicSession } from '@/lib/catalogue'
import { stripeConfigured } from '@/lib/stripe'

export function Agenda({ sessions, heading = true }: { sessions: PublicSession[]; heading?: boolean }) {
  const checkoutAvailable = stripeConfigured()
  return (
    <section className="section wrap agenda" id="agenda" aria-label="Prochaines sessions">
      {heading ? (
        <div className="section-heading">
          <div>
            <p className="eyebrow">LES PROCHAINES DATES</p>
            <h2>
              L’agenda
              <br />
              <em>de l’atelier.</em>
            </h2>
          </div>
          <p>{checkoutAvailable ? 'Choisissez une date pour voir les places disponibles.' : 'Les prochaines dates sont affichées ici. La réservation en ligne est actuellement indisponible.'}</p>
        </div>
      ) : null}
      {sessions.length === 0 ? (
        <p className="quiet-note">Aucune session n’est programmée pour le moment. Les dates confirmées apparaîtront ici.</p>
      ) : (
        <ol className="agenda-list">
          {sessions.map((session) => (
            <li key={session.id}>
              <time dateTime={session.startsAt}>{formatSessionWhen(session.startsAt, session.endsAt)}</time>
              <a href={`/ateliers/${session.workshopSlug}/`}>{session.workshopTitle}</a>
              {session.place ? <span>{session.place}</span> : null}
              {session.capacity ? <span>{session.capacity} participants maximum</span> : null}
              {typeof session.remainingSeats === 'number' ? (
                <span>{session.remainingSeats} place{session.remainingSeats > 1 ? 's' : ''} restante{session.remainingSeats > 1 ? 's' : ''}</span>
              ) : null}
              {session.state === 'full' ? <strong>Session complète</strong> : null}
              {checkoutAvailable && session.priceCents != null &&
              session.depositCents != null &&
              typeof session.remainingSeats === 'number' &&
              session.remainingSeats > 0 &&
              session.state === 'scheduled' ? (
                <a className="button button-small" href={`/reserver?session=${session.id}`}>
                  Réserver
                </a>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
