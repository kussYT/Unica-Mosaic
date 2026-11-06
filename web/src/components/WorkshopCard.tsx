import { ArrowNorthEast } from './Icons'
import { Photo } from './Photo'

type CardWorkshop = {
  slug: string
  name: string
  label: string
  alt: string
  tone: string
  image: string | null
  imageUrl?: string | null
}

export function WorkshopCard({ workshop, index = 0 }: { workshop: CardWorkshop; index?: number }) {
  return (
    <a className={`workshop-card tone-${workshop.tone}`} href={`/ateliers/${workshop.slug}/`}>
      <div className="card-photo">
        {workshop.imageUrl ? (
          <img src={workshop.imageUrl} alt={workshop.alt} />
        ) : workshop.image ? (
          <Photo name={workshop.image} alt={workshop.alt} sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 25vw" />
        ) : null}
        <span className="card-index">0{index + 1}</span>
      </div>
      <div className="card-copy">
        <span className="eyebrow">{workshop.label}</span>
        <div className="card-title">
          <h3>{workshop.name}</h3>
          <span className="circle-arrow" aria-hidden="true"><ArrowNorthEast /></span>
        </div>
      </div>
    </a>
  )
}
