import { ArrowNorthEast } from './Icons'
import { Photo } from './Photo'
import { PhotoCarousel } from './PhotoCarousel'

type CardWorkshop = {
  slug: string
  name: string
  label: string
  alt: string
  tone: string
  image: string | null
  imageUrl?: string | null
}

const rotatingImages: Record<string, string[]> = {
  'recolle-toi-meuf': ['atelier-partage', 'recolle', 'atelier-table'],
  'pixel-kids': ['pixel-kids', 'atelier-table', 'atelier-mains'],
  'ma-croix-mes-couleurs': ['croix', 'atelier-mains', 'atelier-table'],
  'numero-de-maison': ['atelier-mains', 'atelier-table', 'boutique'],
}

export function WorkshopCard({ workshop, index = 0, rotating = false }: { workshop: CardWorkshop; index?: number; rotating?: boolean }) {
  const carousel = rotating ? rotatingImages[workshop.slug] : null
  return (
    <a className={`workshop-card tone-${workshop.tone}`} href={`/ateliers/${workshop.slug}/`}>
      <div className="card-photo">
        {carousel ? (
          <PhotoCarousel
            names={carousel}
            alt={workshop.alt}
            sizes="(max-width: 700px) 90vw, (max-width: 1000px) 45vw, 25vw"
            intervalMs={5800 + index * 850}
            startDelayMs={1200 + index * 1300}
          />
        ) : workshop.imageUrl ? (
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
