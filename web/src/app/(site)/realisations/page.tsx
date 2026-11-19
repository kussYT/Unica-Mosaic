import { Gallery } from '@/components/Gallery'
import { works } from '@/data/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta(
  'Créations sur mesure',
  'Découvrez les créations sur mesure en mosaïque UNICA, réalisées à partir de projets et de pièces existants.',
)

export default function WorksPage() {
  return (
    <div className="works-gallery-page">
      <header className="wrap works-heading">
        <h1>Créations sur mesure</h1>
        <p>Sélectionnez une photo pour l’agrandir.</p>
      </header>
      <Gallery works={works} />
      <div className="wrap works-contact">
        <a className="button" href="/contact/?sujet=Cr%C3%A9ation%20sur%20mesure">
          Parler de mon projet sur mesure
        </a>
      </div>
    </div>
  )
}
