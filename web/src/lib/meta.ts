import type { Metadata } from 'next'

export function pageMeta(title: string, description: string): Metadata {
  return {
    title: { absolute: `${title} — UNICA Mosaïque` },
    description,
    openGraph: { title: `${title} — UNICA`, description },
  }
}
