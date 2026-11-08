'use client'

import { useMemo, useState, type KeyboardEvent } from 'react'

import { Photo } from '@/components/Photo'
import { ArrowLeft, ArrowRight } from '@/components/Icons'
import {
  WEEKDAYS,
  buildMonth,
  dayAvailability,
  dayLabel,
  dayStatusLabel,
  formatDuration,
  formatEuros,
  monthLabel,
  parisDay,
  parisTime,
  parisToday,
  shiftMonth,
  type CalendarSession,
} from '@/lib/calendar'

const monthIndex = (year: number, month: number) => year * 12 + month

export function WorkshopCalendar({ sessions }: { sessions: CalendarSession[] }) {
  const today = useMemo(() => parisToday(), [])
  const firstSession = sessions[0] ? parisDay(sessions[0].startsAt) : null
  const opening = firstSession || today
  const [cursor, setCursor] = useState({ year: opening.year, month: opening.month })
  const [selected, setSelected] = useState<string | null>(firstSession?.key && firstSession.year === opening.year && firstSession.month === opening.month ? firstSession.key : null)

  const month = buildMonth(cursor.year, cursor.month)
  const byDay = useMemo(() => {
    const groups = new Map<string, CalendarSession[]>()
    for (const session of sessions) {
      const key = parisDay(session.startsAt).key
      groups.set(key, [...(groups.get(key) || []), session])
    }
    return groups
  }, [sessions])

  const cells = [
    ...Array.from({ length: month.lead }, () => null),
    ...Array.from({ length: month.days }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const min = monthIndex(today.year, today.month) - 1
  const max = monthIndex(today.year, today.month) + 18
  const current = monthIndex(cursor.year, cursor.month)
  const chosen = selected ? byDay.get(selected) || [] : []
  const selectedParts = selected ? selected.split('-').map(Number) : null

  const move = (delta: number) => {
    const next = shiftMonth(cursor.year, cursor.month, delta)
    if (monthIndex(next.year, next.month) < min || monthIndex(next.year, next.month) > max) return
    setCursor(next)
    const built = buildMonth(next.year, next.month)
    const first = Array.from({ length: built.days }, (_, index) => index + 1).find((day) => byDay.has(dayKey(next.year, next.month, day)))
    setSelected(first ? dayKey(next.year, next.month, first) : null)
  }

  const onDayKey = (event: KeyboardEvent<HTMLButtonElement>, day: number) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    if (!step) return
    event.preventDefault()
    const target = day + step
    if (target < 1 || target > month.days) return
    const key = dayKey(cursor.year, cursor.month, target)
    setSelected(key)
    document.getElementById(`jour-${key}`)?.focus()
  }

  return (
    <section className="section home-calendar" id="calendrier" aria-labelledby="calendar-heading">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">QUAND ON SE RETROUVE</p>
            <h2 id="calendar-heading">
              Le calendrier
              <br />
              <em>de l’atelier.</em>
            </h2>
          </div>
          <p>Seules les sessions confirmées sont posées sur le calendrier. Aucune place n’est réservée depuis cette page.</p>
        </div>
        <div className="calendar-layout">
          <div className="calendar-board">
            <div className="calendar-nav">
              <button type="button" className="calendar-move" onClick={() => move(-1)} disabled={current <= min} aria-label="Mois précédent">
                <span aria-hidden="true"><ArrowLeft /></span>
              </button>
              <p>{monthLabel(cursor.year, cursor.month)}</p>
              <button type="button" className="calendar-move" onClick={() => move(1)} disabled={current >= max} aria-label="Mois suivant">
                <span aria-hidden="true"><ArrowRight /></span>
              </button>
            </div>
            <div role="grid" aria-labelledby="calendar-heading">
              <div role="row" className="calendar-weekdays">
                {WEEKDAYS.map((weekday) => (
                  <div role="columnheader" key={weekday}>
                    {weekday}
                  </div>
                ))}
              </div>
              {Array.from({ length: cells.length / 7 }, (_, row) => (
                <div role="row" className="calendar-row" key={row}>
                  {cells.slice(row * 7, row * 7 + 7).map((day, column) => {
                    if (!day) {
                      const motif = PAD_MOTIFS[(row * 5 + column * 3) % PAD_MOTIFS.length]
                      return <div className={`calendar-pad pad-${motif}`} aria-hidden="true" key={`${row}-${column}`} />
                    }
                    const key = dayKey(cursor.year, cursor.month, day)
                    const daySessions = byDay.get(key) || []
                    const availability = dayAvailability(daySessions)
                    const isToday = key === today.key
                    const isSelected = selected === key
                    const classes = [
                      'calendar-day',
                      availability === 'open' ? 'has-session' : '',
                      availability === 'full' ? 'is-full' : '',
                      isToday ? 'is-today' : '',
                      isSelected ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return (
                      <button
                        id={`jour-${key}`}
                        key={key}
                        type="button"
                        role="gridcell"
                        className={classes}
                        aria-selected={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        aria-label={`${dayLabel(cursor.year, cursor.month, day)}, ${dayStatusLabel(availability, daySessions.length)}`}
                        tabIndex={isSelected || (!selected && day === 1) ? 0 : -1}
                        onClick={() => setSelected(key)}
                        onKeyDown={(event) => onDayKey(event, day)}
                      >
                        <span>{day}</span>
                        {availability === 'open' ? <span className="calendar-dot" aria-hidden="true" /> : null}
                        {availability === 'full' ? <span className="calendar-full-mark" aria-hidden="true" /> : null}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="calendar-panel" aria-live="polite">
            {selectedParts && chosen.length === 0 ? (
              <div className="calendar-quiet">
                <span className="calendar-mark" aria-hidden="true" />
                {selectedParts ? <p className="eyebrow">{dayLabel(selectedParts[0], selectedParts[1], selectedParts[2])}</p> : null}
                <h3>
                  {selectedParts ? (
                    <>
                      Journée
                      <br />
                      <em>libre.</em>
                    </>
                  ) : (
                    <>
                      Aucune date
                      <br />
                      <em>ce mois-ci.</em>
                    </>
                  )}
                </h3>
                <p>{selectedParts ? 'Aucun atelier n’est prévu ce jour-là.' : 'Les sessions confirmées d’un autre mois se découvrent avec les flèches.'}</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="calendar-quiet">
                <span className="calendar-mark" aria-hidden="true" />
                <h3>
                  Aucune date
                  <br />
                  <em>pour le moment.</em>
                </h3>
                <p>Aucune session n’est programmée pour le moment. Les dates confirmées apparaîtront ici.</p>
              </div>
            ) : chosen.length > 0 ? (
              <div className="calendar-events">
                {selectedParts ? <p className="eyebrow">{dayLabel(selectedParts[0], selectedParts[1], selectedParts[2])}</p> : null}
                {chosen.map((session) => (
                  <article className={`calendar-card tone-${session.tone}`} key={session.id}>
                    <div className="calendar-photo">
                      {session.imageUrl ? (
                        <img src={session.imageUrl} alt={session.alt} />
                      ) : session.image ? (
                        <Photo name={session.image} alt={session.alt} sizes="(max-width: 900px) 90vw, 28vw" />
                      ) : null}
                    </div>
                    <div className="calendar-copy">
                      <p className="eyebrow">{session.label}</p>
                      <h3>{session.workshopTitle}</h3>
                      <p className="calendar-time">
                        <time dateTime={session.startsAt}>{parisTime(session.startsAt)}</time>
                        {' – '}
                        <time dateTime={session.endsAt}>{parisTime(session.endsAt)}</time>
                      </p>
                      {session.summary ? <p>{session.summary}</p> : null}
                      <ul>
                        <li>{session.priceCents == null ? 'Tarif à confirmer' : formatEuros(session.priceCents)}</li>
                        {session.depositCents != null ? <li>Acompte {formatEuros(session.depositCents)}</li> : null}
                        {session.durationMinutes != null ? <li>{formatDuration(session.durationMinutes)}</li> : null}
                        {session.place ? <li>{session.place}</li> : null}
                        {session.capacity != null ? <li>{session.capacity} participants maximum</li> : null}
                        {typeof session.remainingSeats === 'number' ? <li>{session.remainingSeats} places restantes</li> : null}
                        {session.state === 'full' ? <li>Session complète</li> : null}
                      </ul>
                      <a href={`/ateliers/${session.workshopSlug}/`}>Voir l’atelier</a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="calendar-quiet">
                <span className="calendar-mark" aria-hidden="true" />
                <h3>
                  Aucune date
                  <br />
                  <em>ce mois-ci.</em>
                </h3>
                <p>Les sessions confirmées d’un autre mois se découvrent avec les flèches.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

const PAD_MOTIFS = ['shard', 'petal', 'wedge', 'pebble', 'facet', 'sliver', 'notch', 'chip'] as const

const dayKey = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
