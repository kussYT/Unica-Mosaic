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
      <Gallery works={works} />
    </div>
  )
}
