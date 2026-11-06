import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Photo } from '@/components/Photo'
import { workshops } from '@/data/site'
import { pageMeta } from '@/lib/meta'

type Args = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return workshops.map((workshop) => ({ slug: workshop.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const workshop = workshops.find((item) => item.slug === slug)
  if (!workshop) return {}
  return pageMeta(workshop.name, workshop.intro) as Metadata
}

export default async function WorkshopPage({ params }: Args) {
  const { slug } = await params
  const workshop = workshops.find((item) => item.slug === slug)
  if (!workshop) notFound()

  return (
    <>
      <div className="wrap breadcrumb">
        <a href="/ateliers/">← Tous les ateliers</a>
        <span>{workshop.name}</span>
      </div>
      <section className={`workshop-detail wrap tone-${workshop.tone}`}>
        <div className="detail-photo">
          <Photo name={workshop.image} alt={workshop.alt} eager />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{workshop.label}</p>
          <h1>{workshop.name}</h1>
          <p className="lead">{workshop.intro}</p>
          <a className="button" href={`/contact/?sujet=${encodeURIComponent(workshop.name)}`}>
            Préparer ma demande <span aria-hidden="true">↗</span>
          </a>
          <p className="quiet-note">Calendrier et réservations bientôt disponibles.</p>
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
          <p>{workshop.detail}</p>
        </div>
        <aside className="info-panel">
          <h3>Les infos pratiques</h3>
          <dl>
            <div>
              <dt>Dates</dt>
              <dd>Calendrier à venir</dd>
            </div>
            <div>
              <dt>Durée & tarif</dt>
              <dd>À confirmer pour chaque séance</dd>
            </div>
            <div>
              <dt>Lieu & matériel</dt>
              <dd>Précisés à l’ouverture des réservations</dd>
            </div>
          </dl>
          <p>Les informations définitives seront indiquées ici avant toute réservation.</p>
        </aside>
      </section>
      <section className="section wrap other-workshops">
        <h2>
          Encore un peu <em>curieux ?</em>
        </h2>
        <div>
          {workshops
            .filter((other) => other.slug !== workshop.slug)
            .map((other) => (
              <a className="text-link" href={`/ateliers/${other.slug}/`} key={other.slug}>
                {other.name} ↗
              </a>
            ))}
        </div>
      </section>
    </>
  )
}
