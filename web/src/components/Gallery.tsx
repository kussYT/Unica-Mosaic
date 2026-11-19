'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

import type { GalleryImage } from '@/lib/realisations'

export function Gallery({ works }: { works: GalleryImage[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const preview = works[index]
  const move = (step: number) => setIndex((current) => (current + step + works.length) % works.length)

  return (
    <section className="wrap gallery-section" aria-label="Galerie des créations sur mesure">
      <div className="gallery-grid">
        {works.map((work, index) => {
          return (
            <article className="gallery-item" key={work.key}>
              <button
                className="gallery-open"
                type="button"
                aria-label={`Agrandir : ${work.title}`}
                onClick={() => {
                  setIndex(index)
                  dialog.current?.showModal()
                }}
              >
                {work.width && work.height && work.src.startsWith('/api/media/file/') && !/\.svg\/?$/i.test(work.src) ? (
                  <Image
                    src={work.src.replace(/\/$/, '')}
                    alt={work.alt}
                    width={work.width}
                    height={work.height}
                    sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 50vw, 33vw"
                    loading={index < 3 ? 'eager' : 'lazy'}
                  />
                ) : <img
                  src={work.src}
                  srcSet={work.srcSet}
                  sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 50vw, 33vw"
                  alt={work.alt}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  fetchPriority={index < 3 ? 'high' : 'auto'}
                  decoding="async"
                />}
              </button>
            </article>
          )
        })}
      </div>
      <dialog
        className="lightbox"
        aria-label="Aperçu de la création"
        ref={dialog}
        onKeyDown={(event) => {
          if (works.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
          event.preventDefault()
          move(event.key === 'ArrowLeft' ? -1 : 1)
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close()
        }}
      >
        <button className="lightbox-close" type="button" aria-label="Fermer l’aperçu" onClick={() => dialog.current?.close()}>
          ×
        </button>
        {preview && (
          <>
            <img id="lightbox-image" src={preview.preview} alt={preview.alt} loading="lazy" />
            <p className="lightbox-caption" aria-live="polite">{preview.title} · {index + 1}/{works.length}</p>
            {preview.description && <p>{preview.description}</p>}
            {works.length > 1 && (
              <div className="lightbox-nav" aria-label="Navigation de la galerie">
                <button className="button button-small" type="button" onClick={() => move(-1)}>Précédente</button>
                <button className="button button-small" type="button" onClick={() => move(1)}>Suivante</button>
              </div>
            )}
          </>
        )}
      </dialog>
    </section>
  )
}
