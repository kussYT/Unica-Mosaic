import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Agenda } from '@/components/Agenda'
import { ArrowLeft, ArrowNorthEast } from '@/components/Icons'
import { Photo } from '@/components/Photo'
import { formatDuration, formatEuros, getPublicWorkshops, getUpcomingSessions } from '@/lib/catalogue'
import { pageMeta } from '@/lib/meta'
import '@/styles/agenda.css'

type Args = { params: Promise<{ slug: string }> }

const workshopVideos: Record<string, { src: string; poster: string; label: string }> = {
  'recolle-toi-meuf': {
    src: '/workshop-videos/workshop-recolle.mp4',
    poster: '/workshop-videos/workshop-recolle-poster.webp',
    label: 'Un aperçu vidéo d’un atelier adulte UNICA.',
  },
  'pixel-kids': {
    src: '/workshop-videos/workshop-pixel-kids.mp4',
    poster: '/workshop-videos/workshop-pixel-kids-poster.webp',
    label: 'Un aperçu vidéo de l’atelier Pixel Kids.',
  },
  'ma-croix-mes-couleurs': {
    src: '/workshop-videos/workshop-gesture.mp4',
    poster: '/workshop-videos/workshop-gesture-poster.webp',
    label: 'Les gestes de création pendant un atelier UNICA.',
  },
  'numero-de-maison': {
    src: '/workshop-videos/workshop-gesture.mp4',
    poster: '/workshop-videos/workshop-gesture-poster.webp',
    label: 'Les gestes de création pendant un atelier UNICA.',
  },
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const workshop = (await getPublicWorkshops()).find((item) => item.slug === slug)
  if (!workshop) return {}
  return pageMeta(workshop.name, workshop.intro)
}

export default async function WorkshopPage({ params }: Args) {
  const { slug } = await params
  const workshops = await getPublicWorkshops()
  const workshop = workshops.find((item) => item.slug === slug)
  if (!workshop) notFound()
  const sessions = await getUpcomingSessions(slug)
  const price = workshop.priceCents == null ? 'À confirmer' : formatEuros(workshop.priceCents)
  const deposit = workshop.depositCents == null ? null : formatEuros(workshop.depositCents)
  const duration = workshop.durationMinutes == null ? null : formatDuration(workshop.durationMinutes)
  const video = workshopVideos[slug]

  return (
    <>
      <div className="wrap breadcrumb">
        <a href="/ateliers/"><ArrowLeft /> Tous les ateliers</a>
        <span>{workshop.name}</span>
      </div>
      <section className={`workshop-detail wrap tone-${workshop.tone}`}>
        <div className="detail-photo">
          {video ? (
            <video controls playsInline preload="metadata" poster={video.poster} aria-label={video.label}>
              <source src={video.src} type="video/mp4" />
            </video>
          ) : workshop.imageUrl ? (
            <img src={workshop.imageUrl} alt={workshop.alt} />
          ) : workshop.image ? (
            <Photo name={workshop.image} alt={workshop.alt} eager />
          ) : null}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{workshop.label}</p>
          <h1>{workshop.name}</h1>
          <p className="lead">{workshop.intro}</p>
          {sessions.some(
            (session) =>
              session.priceCents != null &&
              session.depositCents != null &&
              typeof session.remainingSeats === 'number' &&
              session.remainingSeats > 0 &&
              session.state === 'scheduled',
          ) ? (
            <a className="button" href={`#agenda`}>
              Voir les dates et réserver <span aria-hidden="true"><ArrowNorthEast /></span>
            </a>
          ) : (
            <a className="button" href={`/contact/?sujet=${encodeURIComponent(workshop.name)}`}>
              Préparer ma demande <span aria-hidden="true"><ArrowNorthEast /></span>
            </a>
          )}
          <p className="quiet-note">
            {workshop.priceCents == null || workshop.depositCents == null
              ? 'La réservation en ligne s’ouvre dès que le tarif et l’acompte sont confirmés.'
              : 'Les places ne sont retenues qu’après démarrage du paiement Stripe.'}
          </p>
        </div>
      </section>
      <section className="section wrap detail-info">
        <div>
          <p className="eyebrow">L’ATELIER EN QUELQUES MOTS</p>
          <h2>
            Un moment à vivre,
            <br />
            <em>une pièce à imaginer.</em>
          </h2>
          <p>{workshop.description}</p>
          {workshop.detail ? <p>{workshop.detail}</p> : null}
        </div>
        <aside className="info-panel">
          <h3>Les infos pratiques</h3>
          <dl>
            <div>
              <dt>Dates</dt>
              <dd>{sessions.length === 0 ? 'Aucune session programmée' : `${sessions.length} session${sessions.length > 1 ? 's' : ''} à venir`}</dd>
            </div>
            <div>
              <dt>Durée & tarif</dt>
              <dd>{duration ? `${duration} · ${price}` : price === 'À confirmer' ? 'À confirmer pour chaque séance' : price}</dd>
            </div>
            {deposit ? (
              <div>
                <dt>Acompte</dt>
                <dd>{deposit}</dd>
              </div>
            ) : null}
            <div>
              <dt>Lieu & matériel</dt>
              <dd>{workshop.practicalInfo || sessions.find((session) => session.place)?.place || 'Précisés pour chaque session confirmée'}</dd>
            </div>
          </dl>
          <p>Les informations définitives sont celles confirmées dans l’administration. Le paiement en ligne, s’il est ouvert, utilise Stripe Checkout en euros.</p>
        </aside>
      </section>
      <Agenda sessions={sessions} heading={false} />
      <section className="section wrap other-workshops">
        <h2>
          Encore un peu <em>curieux ?</em>
        </h2>
        <div>
          {workshops
            .filter((other) => other.slug !== workshop.slug)
            .map((other) => (
              <a className="text-link" href={`/ateliers/${other.slug}/`} key={other.slug}>
                {other.name} <span aria-hidden="true"><ArrowNorthEast /></span>
              </a>
            ))}
        </div>
      </section>
    </>
  )
}
