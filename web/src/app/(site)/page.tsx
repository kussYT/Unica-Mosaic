import { CallToAction } from '@/components/CallToAction'
import { ArrowNorthEast, Asterisk } from '@/components/Icons'
import { CalendarSection } from '@/components/HomeCalendar'
import { HomePaths } from '@/components/HomePaths'
import { PhotoCarousel } from '@/components/PhotoCarousel'
import { VideoIntro } from '@/components/VideoIntro'
import { WorkshopCard } from '@/components/WorkshopCard'
import { getPublicWorkshops } from '@/lib/catalogue'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta(
  'L’art de recoller les morceaux',
  'L’univers UNICA : des créations en mosaïque singulières, des projets sur mesure et des ateliers pour le plaisir de créer ensemble.',
)

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const workshops = await getPublicWorkshops()
  return (
    <>
      <VideoIntro />
      <section className="home-hero home-hero-craft wrap">
        <div className="hero-copy">
          <h1>
            L’art de
            <br />
            recoller
            <br />
            <em>les morceaux.</em>
          </h1>
          <div className="hero-actions">
            <a className="button" href="/realisations/">
              Découvrir les créations sur mesure <span aria-hidden="true"><ArrowNorthEast /></span>
            </a>
          </div>
        </div>
        <div className="hero-craft-visual">
          <img className="hero-tool hero-tool-nippers" src="/brand/pince-coupe.png" alt="" aria-hidden="true" />
          <img className="hero-tool hero-tool-rollers" src="/brand/pince-roulette.png" alt="" aria-hidden="true" />
          <div className="hero-craft-frame">
            <PhotoCarousel
              names={['atelier-mains', 'atelier-partage', 'atelier-table']}
              alt="Des mains assemblent patiemment des tesselles de mosaïque à l’atelier UNICA."
              eager
              sizes="(max-width: 760px) calc(100vw - 40px), 58vw"
              intervalMs={7200}
              startDelayMs={900}
            />
          </div>
        </div>
      </section>
      <HomePaths />
      <div className="brand-ribbon" aria-label="Fait main, pièces uniques, créations sur mesure, ateliers créatifs">
        <span>FAIT MAIN</span>
        <b aria-hidden="true"><Asterisk /></b>
        <span>PIÈCES UNIQUES</span>
        <b aria-hidden="true"><Asterisk /></b>
        <span>SUR MESURE</span>
        <b aria-hidden="true"><Asterisk /></b>
        <span>ATELIERS CRÉATIFS</span>
        <b aria-hidden="true"><Asterisk /></b>
      </div>
      <section className="section wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BIENVENUE DANS L’UNIVERS UNICA</p>
            <h2>
              De petits morceaux.
              <br />
              <em>De grandes possibilités.</em>
            </h2>
          </div>
        </div>
        <div className="universe-grid">
          <a className="universe-card" href="/realisations/">
            <PhotoCarousel
              names={['boutique', 'dalida', 'lion', 'blason']}
              alt="Des créations en mosaïque réalisées par UNICA."
              sizes="(max-width: 760px) calc(100vw - 40px), 46vw"
              intervalMs={6100}
              startDelayMs={2500}
            />
            <div>
              <span className="eyebrow">IMAGINER L’UNIQUE</span>
              <h3>
                Vos envies,
                <br />
                en mosaïque.
              </h3>
              <span className="circle-arrow" aria-hidden="true">
                <ArrowNorthEast />
              </span>
            </div>
          </a>
          <a className="universe-card" href="/ateliers/">
            <PhotoCarousel
              names={['atelier-table', 'atelier-partage', 'atelier-mains']}
              alt="Des moments de création partagés pendant les ateliers UNICA."
              sizes="(max-width: 760px) calc(100vw - 40px), 46vw"
              intervalMs={7700}
              startDelayMs={4100}
            />
            <div>
              <span className="eyebrow">FAIRE DE SES MAINS</span>
              <h3>
                Le plaisir
                <br />
                de créer ensemble.
              </h3>
              <span className="circle-arrow" aria-hidden="true">
                <ArrowNorthEast />
              </span>
            </div>
          </a>
        </div>
      </section>
      <section className="workshops-section section">
        <div className="wrap">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ON SE RETROUVE À L’ATELIER ?</p>
              <h2>
                Un moment pour soi.
                <br />
                <em>Une création à soi.</em>
              </h2>
            </div>
            <a className="text-link" href="/ateliers/">
              Tous les ateliers <span aria-hidden="true"><ArrowNorthEast /></span>
            </a>
          </div>
          <div className="workshop-grid">
            {workshops.map((workshop, index) => (
              <WorkshopCard workshop={workshop} index={index} key={workshop.slug} rotating />
            ))}
          </div>
        </div>
      </section>
      <CalendarSection />
      <section className="studio-section section wrap" id="studio">
        <div className="studio-image">
          <PhotoCarousel
            names={['lion', 'tortue', 'dalida']}
            alt="Des mosaïques UNICA prennent forme, morceau après morceau."
            sizes="(max-width: 760px) calc(100vw - 40px), 45vw"
            intervalMs={8300}
            startDelayMs={5300}
          />
        </div>
        <div className="studio-copy">
          <p className="eyebrow">LE SAVOIR-FAIRE, AVEC DU CARACTÈRE</p>
          <h2>
            La tradition
            <br />
            a de beaux
            <br />
            <em>jours devant elle.</em>
          </h2>
          <p>
            Chez UNICA, la mosaïque se réinvente à travers les formes, les couleurs et les matières. Le geste est artisanal, l’esprit résolument libre.
          </p>
          <p>Une pièce décorative, un projet sur mesure ou un atelier : chaque création commence par l’envie d’assembler autrement.</p>
          <a className="text-link" href="/realisations/">
            Entrer dans l’univers UNICA <span aria-hidden="true"><ArrowNorthEast /></span>
          </a>
        </div>
      </section>
      <CallToAction />
    </>
  )
}
