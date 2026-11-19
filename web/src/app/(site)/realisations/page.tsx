import { Gallery } from '@/components/Gallery'
import { getPublicRealisations } from '@/lib/realisations'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta(
  'Créations sur mesure',
  'Découvrez les créations sur mesure en mosaïque UNICA, réalisées à partir de projets et de pièces existants.',
)

export const dynamic = 'force-dynamic'

export default async function WorksPage() {
  const works = await getPublicRealisations()
  return (
    <div className="works-gallery-page">
      <header className="wrap works-heading">
        <h1>Créations sur mesure</h1>
        <p>Sélectionnez une photo pour l’agrandir.</p>
        <a className="text-link" href="/contact/?sujet=Cr%C3%A9ation%20sur%20mesure#formulaire">Parler de mon projet sur mesure</a>
      </header>
      <Gallery works={works} />
      <div className="wrap works-contact">
        <a className="button" href="/contact/?sujet=Cr%C3%A9ation%20sur%20mesure#formulaire">
          Parler de mon projet sur mesure
        </a>
      </div>
    </div>
  )
}
