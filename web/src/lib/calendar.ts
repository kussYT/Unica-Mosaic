export type CalendarSession = {
  id: string
  workshopSlug: string
  workshopTitle: string
  startsAt: string
  endsAt: string
  place: string | null
  capacity: number | null
  state: 'scheduled' | 'full' | 'cancelled'
  label: string
  summary: string
  image: string | null
  imageUrl: string | null
  alt: string
  tone: string
  priceCents: number | null
  depositCents: number | null
  durationMinutes: number | null
  /** Places restantes calculées depuis les réservations confirmées et retenues actives. */
  remainingSeats: number | null
}

const PARIS = 'Europe/Paris'

export type ParisDay = { year: number; month: number; day: number; key: string }

export const parisDay = (iso: string | Date): ParisDay => {
  const date = typeof iso === 'string' ? new Date(iso) : iso
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ''
  const year = Number(value('year'))
  const month = Number(value('month'))
  const day = Number(value('day'))
  return { year, month, day, key: `${value('year')}-${value('month')}-${value('day')}` }
}

export const parisDayKey = (iso: string) => parisDay(iso).key

export const parisToday = () => parisDay(new Date())

export const civilNoon = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day, 12))

const weekdayIndex = (year: number, month: number, day: number) => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: PARIS, weekday: 'short' }).format(civilNoon(year, month, day))
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name)
}

export const buildMonth = (year: number, month: number) => {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { year, month, days, lead: weekdayIndex(year, month, 1) }
}

export const shiftMonth = (year: number, month: number, delta: number) => {
  const cursor = year * 12 + (month - 1) + delta
  return { year: Math.floor(cursor / 12), month: (cursor % 12) + 1 }
}

export const monthLabel = (year: number, month: number) => {
  const label = new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS, month: 'long', year: 'numeric' }).format(civilNoon(year, month, 1))
  return label.charAt(0).toLocaleUpperCase('fr-FR') + label.slice(1)
}

export const dayLabel = (year: number, month: number, day: number) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS, weekday: 'long', day: 'numeric', month: 'long' }).format(civilNoon(year, month, day))

export const parisTime = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: PARIS, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

export const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export const formatEuros = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours && rest) return `${hours} h ${rest} min`
  if (hours) return hours === 1 ? '1 heure' : `${hours} heures`
  return `${rest} min`
}

/** Disponibilité réelle du jour, d’après les sessions Payload déjà filtrées. */
export type DayAvailability = 'none' | 'open' | 'full'

export const dayAvailability = (
  sessions: Array<Pick<CalendarSession, 'state' | 'remainingSeats'>>,
): DayAvailability => {
  const active = sessions.filter((session) => session.state !== 'cancelled')
  if (active.length === 0) return 'none'
  const hasOpen = active.some((session) => {
    if (typeof session.remainingSeats === 'number') return session.remainingSeats > 0
    if (session.state === 'full') return false
    return session.state === 'scheduled'
  })
  return hasOpen ? 'open' : 'full'
}

export const dayStatusLabel = (availability: DayAvailability, count: number) => {
  if (availability === 'none') return 'aucun atelier'
  if (availability === 'full') return count === 1 ? 'atelier complet' : `${count} ateliers complets`
  return count === 1 ? '1 atelier disponible' : `${count} ateliers disponibles`
}
