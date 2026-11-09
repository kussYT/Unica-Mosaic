'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const INTRO_SEEN_KEY = 'unicaIntroSeen'
/** Durée d’affichage alignée sur la séquence source continue (IMG_8045, ~5,53 s). */
const INTRO_MS = 5530

export function VideoIntro() {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const leavingRef = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dismiss = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)

    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    } catch {
      // The intro still works if storage is unavailable.
    }

    closeTimer.current = setTimeout(() => {
      document.documentElement.classList.add('intro-seen')
      setVisible(false)
    }, 620)
  }, [])

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let alreadySeen = false

    try {
      alreadySeen = sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
    } catch {
      // Keep the short intro available when storage is unavailable.
    }

    if (prefersReducedMotion || alreadySeen) {
      setVisible(false)
      return
    }

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
  }, [dismiss])

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
