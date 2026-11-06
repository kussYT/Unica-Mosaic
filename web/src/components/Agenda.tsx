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
          <p>Seules les sessions confirmées dans l’administration sont affichées. Aucune place n’est réservée depuis cette page.</p>
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
              {session.state === 'full' ? <strong>Session complète</strong> : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
