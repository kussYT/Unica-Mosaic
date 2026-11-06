import type { workshops } from '@/data/site'

import { Photo } from './Photo'

type Workshop = (typeof workshops)[number]

export function WorkshopCard({ workshop, index = 0 }: { workshop: Workshop; index?: number }) {
  return (
    <a className={`workshop-card tone-${workshop.tone}`} href={`/ateliers/${workshop.slug}/`}>
      <div className="card-photo">
        <Photo name={workshop.image} alt={workshop.alt} sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 25vw" />
        <span className="card-index">0{index + 1}</span>
      </div>
      <div className="card-copy">
        <span className="eyebrow">{workshop.label}</span>
        <div className="card-title">
          <h3>{workshop.name}</h3>
          <span className="circle-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </a>
  )
}
