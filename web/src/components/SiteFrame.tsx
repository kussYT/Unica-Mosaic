'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { ArrowNorthEast } from './Icons'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/realisations/', label: 'Les créations' },
  { href: '/ateliers/', label: 'Les ateliers' },
  { href: '/#studio', label: 'L’univers UNICA' },
]

function normalize(pathname: string) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = normalize(usePathname() || '/')
  const [open, setOpen] = useState(false)
  const year = new Date().getFullYear()

  useEffect(() => {
    document.documentElement.classList.toggle('is-home', pathname === '/')
  }, [pathname])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <header className="site-header">
        <a className="brand" href="/" aria-label="UNICA — Accueil">
          <img src="/images/logo-rose.svg" alt="UNICA, créations mosaïques" width="240" height="84" />
        </a>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="navigation"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setOpen((value) => !value)}
        >
          <span></span>
          <span></span>
        </button>
        <nav id="navigation" className={open ? 'is-open' : undefined} aria-label="Navigation principale">
          {nav.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.href !== '/#studio' && pathname.startsWith(link.href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a className="button button-small" href="/contact/" onClick={() => setOpen(false)}>
            Parlons de votre projet <span aria-hidden="true"><ArrowNorthEast /></span>
          </a>
        </nav>
      </header>
      <main id="contenu">{children}</main>
      <footer className="site-footer">
        <div className="footer-top">
          <a href="/" aria-label="UNICA — Accueil">
            <img src="/images/logo-creme.svg" width="260" height="95" alt="UNICA" />
          </a>
          <p>
            Des mains, de la matière.
            <br />
            <em>Et beaucoup de caractère.</em>
          </p>
          <a className="text-link" href="/contact/">
            Écrivons la suite ensemble <span aria-hidden="true"><ArrowNorthEast /></span>
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {year} UNICA · Créations mosaïques</span>
          <nav aria-label="Navigation de pied de page">
            <a href="/realisations/">Créations</a>
            <a href="/ateliers/">Ateliers</a>
            <a href="/contact/">Contact</a>
          </nav>
          <span>Fait de petits morceaux. Et de grandes idées.</span>
        </div>
      </footer>
    </>
  )
}
