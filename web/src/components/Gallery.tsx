'use client'

import { useRef, useState } from 'react'

import type { works } from '@/data/site'

import { Photo } from './Photo'

type Work = (typeof works)[number]
const filters = ['Tout voir', 'Décoration', 'Sur mesure', 'En atelier'] as const

export function Gallery({ works }: { works: Work[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('Tout voir')
  const dialog = useRef<HTMLDialogElement>(null)
  const [preview, setPreview] = useState({ src: '', alt: '', title: '' })
  const visible = works.filter((work) => filter === 'Tout voir' || work.category === filter)

  return (
    <section className="wrap gallery-section" aria-label="Galerie des réalisations">
      <div className="filter-bar" role="group" aria-label="Filtrer les créations">
        {filters.map((item) => (
          <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <p id="gallery-count" className="sr-only" role="status" aria-live="polite">
        {visible.length} créations affichées
      </p>
      <div className="gallery-grid">
        {works.map((work, index) => {
          const hidden = filter !== 'Tout voir' && work.category !== filter
          return (
            <article className="gallery-item" hidden={hidden || undefined} key={work.image}>
              <button
                className="gallery-open"
                type="button"
                aria-label={`Agrandir : ${work.title}`}
                onClick={() => {
                  setPreview({ src: `/images/${work.image}-1600.webp`, alt: work.alt, title: work.title })
                  dialog.current?.showModal()
                }}
              >
                <Photo name={work.image} alt={work.alt} eager={index < 2} />
                <span className="circle-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
              <div className="gallery-caption">
                <h2>{work.title}</h2>
                <span>{work.category}</span>
              </div>
            </article>
          )
        })}
      </div>
      <dialog
        className="lightbox"
        aria-label="Aperçu de la création"
        ref={dialog}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <button className="lightbox-close" type="button" aria-label="Fermer l’aperçu" onClick={() => dialog.current?.close()}>
          ×
        </button>
        <img id="lightbox-image" src={preview.src || undefined} alt={preview.alt} />
        <p id="lightbox-title">{preview.title}</p>
      </dialog>
    </section>
  )
}
