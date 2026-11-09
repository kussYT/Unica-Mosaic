import { formatSessionWhen, type PublicSession } from '@/lib/catalogue'

export function Agenda({ sessions, heading = true }: { sessions: PublicSession[]; heading?: boolean }) {
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
          <p>Seules les sessions confirmées dans l’administration sont affichées. La réservation en ligne ouvre Stripe Checkout lorsque le tarif et les places sont disponibles.</p>
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
              {session.priceCents != null &&
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
