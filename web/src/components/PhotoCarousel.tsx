'use client'

import { useEffect, useState } from 'react'

type PhotoCarouselProps = {
  names: string[]
  alt: string
  intervalMs?: number
  startDelayMs?: number
  sizes?: string
  eager?: boolean
  className?: string
}

export function PhotoCarousel({
  names,
  alt,
  intervalMs = 6500,
  startDelayMs = 0,
  sizes = '100vw',
  eager = false,
  className = '',
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (names.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let intervalId: number | undefined
    const advance = () => setActiveIndex((current) => (current + 1) % names.length)
    const timeoutId = window.setTimeout(() => {
      advance()
      intervalId = window.setInterval(advance, intervalMs)
    }, startDelayMs + intervalMs)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [intervalMs, names.length, startDelayMs])

  return (
    <span className={`photo-carousel ${className}`.trim()} role="img" aria-label={alt}>
      {names.map((name, index) => (
        <picture
          className={`photo-carousel-picture${index === activeIndex ? ' is-active' : ''}`}
          aria-hidden="true"
          key={name}
        >
          <source media="(max-width: 560px)" srcSet={`/images/${name}-480.webp`} />
          <source media="(max-width: 1100px)" srcSet={`/images/${name}-960.webp`} />
          <img
            src={`/images/${name}-1600.webp`}
            srcSet={`/images/${name}-480.webp 480w, /images/${name}-960.webp 960w, /images/${name}-1600.webp 1600w`}
            sizes={sizes}
            alt=""
            loading={eager && index === 0 ? 'eager' : 'lazy'}
            fetchPriority={eager && index === 0 ? 'high' : 'auto'}
          />
        </picture>
      ))}
    </span>
  )
}
