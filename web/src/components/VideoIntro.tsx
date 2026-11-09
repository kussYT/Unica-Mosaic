'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Durée d’affichage alignée sur la séquence source continue (IMG_8045, ~5,53 s). */
const INTRO_MS = 5530

/** Décision du document courant. Un rechargement recrée le module ; une navigation interne le conserve. */
let arrivalDecision: boolean | null = null

function isHomePath(pathname: string) {
  return pathname === '/' || pathname === ''
}

/** Vrai pour un chargement ou un rafraîchissement de l’accueil, faux pour une arrivée interne. */
function arrivalShouldPlay() {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  if (entry) {
    try {
      if (!isHomePath(new URL(entry.name).pathname)) return false
    } catch {
      if (!isHomePath(window.location.pathname)) return false
    }
    if (entry.type === 'reload') return true
    if (entry.type === 'back_forward') return false
  } else if (!isHomePath(window.location.pathname)) {
    return false
  }

  if (!document.referrer) return true
  try {
    return new URL(document.referrer).origin !== window.location.origin
  } catch {
    return true
  }
}

function shouldShowOnFirstPaint() {
  if (typeof window === 'undefined') return true
  return arrivalDecision === null
}

export function VideoIntro() {
  const [visible, setVisible] = useState(shouldShowOnFirstPaint)
  const [leaving, setLeaving] = useState(false)
  const leavingRef = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)

    closeTimer.current = setTimeout(() => {
      document.documentElement.classList.add('intro-seen')
      setVisible(false)
    }, 620)
  }, [])

  useLayoutEffect(() => {
    if (arrivalDecision === null) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      arrivalDecision = arrivalShouldPlay() && !prefersReducedMotion
    }

    if (!arrivalDecision) {
      document.documentElement.classList.add('intro-seen')
      if (visible) setVisible(false)
      return
    }

    if (!visible) return

    const timer = window.setTimeout(dismiss, INTRO_MS)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dismiss, visible])

  if (!visible) return null

  return (
    <aside className={`video-intro${leaving ? ' is-leaving' : ''}`} aria-label="Introduction vidéo UNICA">
      <video
        className="video-intro-media"
        autoPlay
        muted
        playsInline
        preload="metadata"
        poster="/media/intro-unica-poster.webp"
        onEnded={dismiss}
      >
        <source src="/media/intro-unica.mp4" type="video/mp4" />
      </video>
      <div className="video-intro-shade" aria-hidden="true" />
      <div className="video-intro-brand">
        <img
          src="/images/logo-unica-h.svg"
          width="770"
          height="225"
          alt="UNICA, créations mosaïques"
        />
      </div>
      <button className="video-intro-skip" type="button" onClick={dismiss}>
        Passer l’intro <span aria-hidden="true">→</span>
      </button>
      <span className="video-intro-progress" aria-hidden="true" />
    </aside>
  )
}
