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
  themeColor: '#FCF4F1',
}

export const metadata: Metadata = {
  metadataBase: new URL('http://127.0.0.1:3000'),
  title: { default: 'UNICA Mosaïque', template: '%s — UNICA Mosaïque' },
  description:
    'L’univers UNICA : des créations en mosaïque singulières, des projets sur mesure et des ateliers pour le plaisir de créer ensemble.',
  robots: { index: false, follow: false },
  icons: { icon: [{ url: '/images/favicon.svg', type: 'image/svg+xml' }] },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: 'UNICA' },
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.toggle('is-home',location.pathname==='/'||location.pathname==='')",
          }}
        />
      </head>
      <body>
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  )
}
