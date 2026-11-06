import { WorkshopCalendar } from '@/components/WorkshopCalendar'
import { getCalendarSessions } from '@/lib/catalogue'
import '@/styles/calendar.css'

export async function CalendarSection() {
  const sessions = await getCalendarSessions()
  return <WorkshopCalendar sessions={sessions} />
}

export function CalendarSkeleton() {
  return (
    <section className="section home-calendar" aria-labelledby="calendar-heading" aria-busy="true">
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
          <p>Les dates confirmées arrivent.</p>
        </div>
        <div className="calendar-layout">
          <div className="calendar-board calendar-skeleton" />
          <div className="calendar-quiet calendar-skeleton" />
        </div>
      </div>
    </section>
  )
}
