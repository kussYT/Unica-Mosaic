import { Agenda } from '@/components/Agenda'
import { CallToAction } from '@/components/CallToAction'
import { Photo } from '@/components/Photo'
import { WorkshopCard } from '@/components/WorkshopCard'
import { getPublicWorkshops, getUpcomingSessions } from '@/lib/catalogue'
import { pageMeta } from '@/lib/meta'
import '@/styles/agenda.css'

export const metadata = pageMeta(
  'Les ateliers créatifs',
  'Découvrez les ateliers UNICA : Ré-colle-toi meuf, Pixel Kids, Ma croix mes couleurs et Numéro de maison.',
)

export const dynamic = 'force-dynamic'

export default async function WorkshopsPage() {
  const workshops = await getPublicWorkshops()
  const sessions = await getUpcomingSessions()
  return (
    <>
      <section className="page-hero pink-hero">
        <div className="wrap split">
          <div>
            <p className="eyebrow">DU TEMPS POUR CRÉER. DU PLAISIR À PARTAGER.</p>
            <h1>
              On recolle.
              <br />
              On crée.
              <br />
              <em>On se retrouve.</em>
            </h1>
            <p>Choisir ses couleurs, assembler ses idées et voir naître quelque chose de ses mains. Bienvenue aux ateliers UNICA.</p>
            <a className="button button-yellow" href="#les-ateliers">
              Trouver mon atelier <span aria-hidden="true">↓</span>
            </a>
          </div>
          <Photo name="atelier-partage" alt="Des participantes sourient et créent ensemble à l’atelier UNICA." eager className="hero-portrait" />
        </div>
      </section>
      <section className="section wrap" id="les-ateliers">
        <div className="section-heading">
          <div>
            <p className="eyebrow">QUATRE ENVIES DE CRÉER</p>
            <h2>
              À chacun
              <br />
              <em>son petit morceau.</em>
            </h2>
          </div>
          <p>Des univers différents, un même plaisir : faire de ses mains. Découvrez l’esprit de chaque atelier.</p>
        </div>
        <div className="workshop-grid">
          {workshops.map((workshop, index) => (
            <WorkshopCard workshop={workshop} index={index} key={workshop.slug} />
          ))}
        </div>
        <p className="quiet-note">Les tarifs et les modalités restent indiqués seulement lorsqu’ils ont été confirmés.</p>
      </section>
      <Agenda sessions={sessions} />
      <section className="steps-section section wrap">
        <p className="eyebrow">L’ESPRIT D’UN ATELIER</p>
        <h2>Un morceau après l’autre.</h2>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>On s’inspire</h3>
            <p>Des matières, des couleurs et des exemples pour laisser venir les idées.</p>
          </article>
          <article>
            <span>02</span>
            <h3>On compose</h3>
            <p>On découvre le geste, on assemble et on donne sa propre personnalité à la création.</p>
          </article>
          <article>
            <span>03</span>
            <h3>On partage</h3>
            <p>Un moment autour de la table, des échanges et le plaisir de voir son idée prendre forme.</p>
          </article>
        </div>
      </section>
      <section className="faq-section section wrap">
        <div>
          <p className="eyebrow">AVANT DE SE LANCER</p>
          <h2>
            Les petites
            <br />
            <em>questions.</em>
          </h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>Comment connaître les prochaines dates ?</summary>
            <p>Les dates confirmées sont listées dans l’agenda de cette page. S’il est vide, aucune session n’est programmée.</p>
          </details>
          <details>
            <summary>Quel atelier choisir pour un enfant ?</summary>
            <p>Pixel Kids est l’univers dédié aux enfants. L’âge conseillé et les conditions d’accompagnement seront précisés pour chaque séance.</p>
          </details>
          <details>
            <summary>Peut-on imaginer un atelier en groupe ?</summary>
            <p>Une envie de moment créatif à plusieurs ? Préparez votre demande en indiquant l’occasion, le nombre de participants et la période souhaitée.</p>
            <a className="text-link" href="/contact/?sujet=Atelier%20en%20groupe">
              Préparer mon projet de groupe →
            </a>
          </details>
        </div>
      </section>
      <CallToAction title="Une envie de créer à plusieurs ?" text="Un anniversaire, une occasion particulière ou simplement le plaisir de se retrouver autour d’une table." />
    </>
  )
}
