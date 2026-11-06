import { ArrowNorthEast } from './Icons'

export function CallToAction({
  title = 'Et si on créait quelque chose ensemble ?',
  text = 'Une idée, une envie, un projet encore un peu flou ? Tout commence par une conversation.',
}: {
  title?: string
  text?: string
}) {
  return (
    <section className="cta-section">
      <span className="eyebrow">À VOUS DE JOUER</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <a className="button button-yellow" href="/contact/">
        Parlons-en <span aria-hidden="true"><ArrowNorthEast /></span>
      </a>
      <span className="tile tile-a" aria-hidden="true"></span>
      <span className="tile tile-b" aria-hidden="true"></span>
    </section>
  )
}
