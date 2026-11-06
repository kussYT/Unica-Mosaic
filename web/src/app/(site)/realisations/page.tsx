import { CallToAction } from '@/components/CallToAction'
import { Gallery } from '@/components/Gallery'
import { works } from '@/data/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta(
  'Les créations',
  'Explorez les créations en mosaïque UNICA : pièces décoratives, projets sur mesure et gestes d’atelier.',
)

export default function WorksPage() {
  return (
    <>
      <section className="gallery-intro wrap">
        <p className="eyebrow">LA MOSAÏQUE SOUS TOUTES SES FORMES</p>
        <h1>
          Des pièces uniques.
          <br />
          <em>Du caractère, toujours.</em>
        </h1>
        <p>
          Des couleurs qui se répondent. Des matières qui accrochent la lumière.
          <br />
          Et une autre façon de regarder les petits morceaux.
        </p>
      </section>
      <Gallery works={works} />
      <CallToAction
        title="Votre idée mérite sa mosaïque."
        text="Un motif, une ambiance, une pièce à transformer : racontons votre projet avec des matières et des couleurs."
      />
    </>
  )
}
