import { getPayload } from 'payload'

import config from '@payload-config'
import { workshops as staticWorkshops } from '@/data/site'
import type { CalendarSession } from '@/lib/calendar'

export type PublicWorkshop = {
  slug: string
  name: string
  label: string
  intro: string
  description: string
  detail: string
  alt: string
  image: string | null
  imageUrl: string | null
  tone: string
  priceCents: number | null
  depositCents: number | null
  durationMinutes: number | null
  practicalInfo: string | null
}

export type PublicSession = {
  id: string
  workshopSlug: string
  workshopTitle: string
  startsAt: string
  endsAt: string
  place: string | null
  capacity: number | null
  state: 'scheduled' | 'full' | 'cancelled'
}

const tones: Record<string, string> = {
  'recolle-toi-meuf': 'pink',
  'pixel-kids': 'blush',
  'ma-croix-mes-couleurs': 'plum',
  'numero-de-maison': 'cream',
}

const staticCatalogue = (): PublicWorkshop[] =>
  staticWorkshops.map((workshop) => ({
    slug: workshop.slug,
    name: workshop.name,
    label: workshop.label,
    intro: workshop.intro,
    description: workshop.description,
    detail: workshop.detail,
    alt: workshop.alt,
    image: workshop.image,
    imageUrl: null,
    tone: workshop.tone,
    priceCents: null,
    depositCents: null,
    durationMinutes: null,
    practicalInfo: null,
  }))

const mediaUrl = (value: unknown): { url: string; alt: string } | null => {
  if (!value || typeof value !== 'object') return null
  const media = value as { url?: string; alt?: string; mimeType?: string }
  if (!media.url || media.mimeType?.startsWith('video/')) return null
  return { url: media.url, alt: media.alt || '' }
}

export async function getPublicWorkshops(): Promise<PublicWorkshop[]> {
  const catalogue = new Map(staticCatalogue().map((workshop) => [workshop.slug, workshop]))
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'workshops',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'title',
    })
    for (const doc of result.docs) {
      const first = Array.isArray(doc.gallery) ? mediaUrl(doc.gallery[0]) : null
      const current = catalogue.get(doc.slug)
      catalogue.set(doc.slug, {
        slug: doc.slug,
        name: doc.title,
        label: doc.label || current?.label || 'ATELIER',
        intro: doc.summary,
        description: doc.description,
        detail: doc.practicalInfo || current?.detail || '',
        alt: first?.alt || current?.alt || doc.title,
        image: first ? null : current?.image || null,
        imageUrl: first?.url || null,
        tone: doc.tone || current?.tone || tones[doc.slug] || 'pink',
        priceCents: typeof doc.priceCents === 'number' ? doc.priceCents : null,
        depositCents: typeof doc.depositCents === 'number' ? doc.depositCents : null,
        durationMinutes: typeof doc.durationMinutes === 'number' ? doc.durationMinutes : null,
        practicalInfo: doc.practicalInfo || null,
      })
    }
  } catch (error) {
    console.error('Catalogue Payload indisponible, conservation du contenu statique.', error)
  }
  return [...catalogue.values()]
}

export async function getCalendarSessions(): Promise<CalendarSession[]> {
  const [sessions, workshops] = await Promise.all([getUpcomingSessions(), getPublicWorkshops()])
  const bySlug = new Map(workshops.map((workshop) => [workshop.slug, workshop]))
  return sessions.map((session) => {
    const workshop = bySlug.get(session.workshopSlug)
    return {
      ...session,
      label: workshop?.label || 'ATELIER',
      summary: workshop?.intro || '',
      image: workshop?.image || null,
      imageUrl: workshop?.imageUrl || null,
      alt: workshop?.alt || session.workshopTitle,
      tone: workshop?.tone || 'pink',
      priceCents: workshop?.priceCents ?? null,
      depositCents: workshop?.depositCents ?? null,
      durationMinutes: workshop?.durationMinutes ?? null,
      remainingSeats: null,
    }
  })
}

export async function getUpcomingSessions(slug?: string): Promise<PublicSession[]> {
  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const result = await payload.find({
      collection: 'sessions',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      sort: 'startsAt',
      where: {
        and: [
          { startsAt: { greater_than_equal: now } },
          { state: { not_equals: 'cancelled' } },
        ],
      },
    })
    return result.docs.flatMap((doc) => {
      const workshop = doc.workshop
      if (!workshop || typeof workshop !== 'object') return []
      if (slug && workshop.slug !== slug) return []
      if (!doc.startsAt || !doc.endsAt) return []
      return [
        {
          id: String(doc.id),
          workshopSlug: workshop.slug,
          workshopTitle: workshop.title,
          startsAt: doc.startsAt,
          endsAt: doc.endsAt,
          place: doc.place || null,
          capacity: typeof doc.capacity === 'number' ? doc.capacity : null,
          state: doc.state,
        },
      ]
    })
  } catch (error) {
    console.error('Sessions Payload indisponibles.', error)
    return []
  }
}

export { formatDuration, formatEuros } from '@/lib/calendar'

const paris = { timeZone: 'Europe/Paris' }

export const formatSessionWhen = (startsAt: string, endsAt: string) => {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const day = new Intl.DateTimeFormat('fr-FR', { ...paris, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(start)
  const time = new Intl.DateTimeFormat('fr-FR', { ...paris, hour: '2-digit', minute: '2-digit' }).format(start)
  const endTime = new Intl.DateTimeFormat('fr-FR', { ...paris, hour: '2-digit', minute: '2-digit' }).format(end)
  return `${day}, ${time} – ${endTime}`
}
