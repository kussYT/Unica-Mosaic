import type { Metadata } from 'next'
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '../../../src/styles/global.css'

import { MissingPiece } from '@/components/MissingPiece'
import { SiteFrame } from '@/components/SiteFrame'

export const metadata: Metadata = {
  title: 'Un morceau manque — UNICA Mosaïque',
  description: 'Retrouvez l’univers UNICA depuis la page d’accueil.',
  robots: { index: false, follow: false },
}

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body>
        <SiteFrame>
          <MissingPiece />
        </SiteFrame>
      </body>
    </html>
  )
}
