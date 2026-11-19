import { Suspense } from 'react'

import { ContactForm } from '@/components/ContactForm'
import { Photo } from '@/components/Photo'
import { site } from '@/data/site'
import { privateContactConfig } from '@/lib/private-contact'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta(
  'Parlons de votre projet',
  'Une création sur mesure, un atelier ou un projet de groupe : préparez votre demande pour UNICA.',
)

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  const privateSend = Boolean(privateContactConfig())
  return (
    <section className="contact-section wrap">
      <div className="contact-copy">
        <p className="eyebrow">TOUT COMMENCE PAR UNE ENVIE</p>
        <h1>
          Une idée ?
          <br />
          <em>Parlons-en.</em>
        </h1>
        <p>
          Une pièce pour chez vous, un cadeau à imaginer, un moment à partager… Racontez-nous le petit morceau d’histoire que vous avez en tête.
        </p>
      </div>
      <div id="formulaire" className="contact-panel">
        <h2>Votre projet, en quelques mots.</h2>
        <p className="contact-notice">
          {privateSend
            ? 'Vous pouvez envoyer une demande d’atelier privé directement depuis cette page.'
            : site.email
            ? 'Ce formulaire prépare un e-mail à envoyer depuis votre messagerie.'
            : 'La prise de contact en ligne arrive bientôt. Vous pouvez déjà préparer et télécharger votre demande. Aucun message ne sera envoyé.'}
        </p>
        <Suspense fallback={null}>
          <ContactForm email={site.email} privateSend={privateSend} />
        </Suspense>
        <noscript>
          <p>Activez JavaScript pour préparer votre demande dans cette version de travail.</p>
        </noscript>
      </div>
      <div className="contact-photo">
        <Photo name="atelier-mains" alt="Une création en mosaïque prend forme, tesselle après tesselle." />
        <span className="photo-caption">LES BELLES HISTOIRES COMMENCENT PAR UN PREMIER MORCEAU.</span>
      </div>
    </section>
  )
}
