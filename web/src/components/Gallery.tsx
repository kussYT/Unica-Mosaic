'use client'

import { useRef, useState } from 'react'

import type { works } from '@/data/site'

type Work = (typeof works)[number]

export function Gallery({ works }: { works: Work[] }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [preview, setPreview] = useState({ src: '', alt: '' })

  return (
    <section className="wrap gallery-section" aria-label="Galerie des créations sur mesure">
      <div className="gallery-grid">
        {works.map((work, index) => {
          return (
            <article className="gallery-item" key={work.image}>
              <button
                className="gallery-open"
                type="button"
                aria-label={`Agrandir : ${work.title}`}
                onClick={() => {
                  setPreview({ src: `/images/${work.image}-1600.webp`, alt: work.alt })
                  dialog.current?.showModal()
                }}
              >
                <img
                  src={`/images/${work.image}-960.webp`}
                  srcSet={`/images/${work.image}-480.webp 480w, /images/${work.image}-960.webp 960w, /images/${work.image}-1600.webp 1600w`}
                  sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 50vw, 33vw"
                  alt={work.alt}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  fetchPriority={index < 3 ? 'high' : 'auto'}
                  decoding="async"
                />
              </button>
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
      </dialog>
    </section>
  )
}
