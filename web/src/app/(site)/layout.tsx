import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@fontsource/montserrat/latin-400.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-500-italic.css'
import '../../../../src/styles/global.css'

import { SiteFrame } from '@/components/SiteFrame'

export const viewport: Viewport = {
  themeColor: '#F4E2DA',
}

export const metadata: Metadata = {
  metadataBase: new URL('http://127.0.0.1:3000'),
  title: { default: 'UNICA Mosaïque', template: '%s — UNICA Mosaïque' },
  description:
    'L’univers UNICA : des créations en mosaïque singulières, des projets sur mesure et des ateliers pour le plaisir de créer ensemble.',
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: '/images/pictogramme-unica.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/images/pictogramme-unica.png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'UNICA',
    images: [{ url: '/images/pictogramme-unica.png', alt: 'Pictogramme UNICA' }],
  },
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var home=location.pathname==='/'||location.pathname==='';document.documentElement.classList.toggle('is-home',home);if(!home)return;var nav=performance.getEntriesByType('navigation')[0];var type=nav&&nav.type;var play=type==='reload';if(!play&&type!=='back_forward'){try{play=!document.referrer||new URL(document.referrer).origin!==location.origin;}catch(e){play=true;}}if(!play)document.documentElement.classList.add('intro-seen');})();",
          }}
        />
      </head>
      <body>
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  )
}
