import { homePaths } from '@/data/site'

import { Photo } from './Photo'

export function HomePaths() {
  return (
    <section className="home-paths wrap" aria-label="Entrer dans l’univers UNICA">
      <svg className="clip-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id="clip-path-real" clipPathUnits="objectBoundingBox">
            <path d="M0.26,0.08 C0.46,0 0.72,0.04 0.9,0.18 C1.02,0.34 0.96,0.62 0.9,0.82 C0.8,1.02 0.52,1 0.3,0.88 C0.08,0.74 0.02,0.48 0.1,0.26 C0.16,0.12 0.16,0.1 0.26,0.08 Z" />
          </clipPath>
          <clipPath id="clip-path-atelier" clipPathUnits="objectBoundingBox">
            <path d="M0.18,0.12 C0.4,0 0.68,0.06 0.88,0.2 C1.02,0.36 0.96,0.66 0.84,0.88 C0.7,1.04 0.42,0.98 0.22,0.86 C0.02,0.72 0,0.46 0.08,0.26 C0.12,0.14 0.1,0.12 0.18,0.12 Z" />
          </clipPath>
          <clipPath id="clip-path-kids" clipPathUnits="objectBoundingBox">
            <path d="M0.3,0.04 C0.52,0.08 0.76,0 0.94,0.16 C1.04,0.34 0.98,0.62 0.88,0.84 C0.76,1.02 0.48,0.96 0.28,0.88 C0.06,0.76 0.02,0.5 0.1,0.28 C0.16,0.1 0.18,0.02 0.3,0.04 Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="path-grid">
        {homePaths.map((card) => (
          <a className={`path-card path-${card.tone}`} href={card.href} key={card.href}>
            <span className="path-photo">
              <Photo name={card.image} alt={card.alt} eager sizes="(max-width: 760px) 70vw, 24vw" />
            </span>
            <i className="path-shard" aria-hidden="true"></i>
            <span className="path-copy">
              <span className="path-title">{card.title}</span>
              <span className="path-arrow" aria-hidden="true">→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
