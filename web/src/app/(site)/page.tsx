import { CallToAction } from '@/components/CallToAction'
import { ArrowNorthEast, Asterisk } from '@/components/Icons'
import { CalendarSection } from '@/components/HomeCalendar'
import { HeroChips, HeroCollage } from '@/components/HeroCollage'
import { HomePaths } from '@/components/HomePaths'
import { Photo } from '@/components/Photo'
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
      <section className="home-hero wrap">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="little-diamond" aria-hidden="true"></span> CRÉATIONS MOSAÏQUES · VALENCIENNES
          </p>
          <h1>
            L’art de
            <br />
            recoller
            <br />
            <em>les morceaux.</em>
          </h1>
          <div className="hero-actions">
            <HeroChips />
            <a className="button" href="/realisations/">
              Explorer les créations <span aria-hidden="true"><ArrowNorthEast /></span>
            </a>
          </div>
        </div>
        <HeroCollage />
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
          <p>La mosaïque sort du cadre. Elle devient une pièce de caractère, un détail qui change tout, ou un moment à partager.</p>
        </div>
        <div className="universe-grid">
          <a className="universe-card" href="/realisations/">
            <Photo name="boutique" alt="Une grande mosaïque figurative exposée dans la boutique." />
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
            <Photo name="atelier-mains" alt="Des mains assemblent une mosaïque à l’atelier." />
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
              <WorkshopCard workshop={workshop} index={index} key={workshop.slug} />
            ))}
          </div>
        </div>
      </section>
      <CalendarSection />
      <section className="studio-section section wrap" id="studio">
        <div className="studio-image">
          <Photo name="lion" alt="Une mosaïque de lion prend forme sous les mains de l’artisane." />
          <span className="studio-label">
            L’ESPRIT DE LA TRADITION.
            <br />
            L’ÉNERGIE D’AUJOURD’HUI.
          </span>
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
