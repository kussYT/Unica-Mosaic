import { getPayload } from 'payload'

import config from '@payload-config'
import { works } from '@/data/site'

export type GalleryImage = {
  key: string
  title: string
  alt: string
  description?: string | null
  src: string
  srcSet?: string
  preview: string
}

const fallback: GalleryImage[] = works.map((work) => ({
  key: work.image,
  title: work.title,
  alt: work.alt,
  src: `/images/${work.image}-960.webp`,
  srcSet: `/images/${work.image}-480.webp 480w, /images/${work.image}-960.webp 960w, /images/${work.image}-1600.webp 1600w`,
  preview: `/images/${work.image}-1600.webp`,
}))

export async function getPublicRealisations(): Promise<GalleryImage[]> {
  if (!process.env.PAYLOAD_SECRET || !process.env.DATABASE_URL) return fallback
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'realisations',
      overrideAccess: false,
      draft: false,
      depth: 1,
      pagination: false,
      sort: ['displayOrder', 'id'],
    })
    const images = docs.flatMap((work) => (work.photos ?? []).flatMap((photo, index) => {
      if (typeof photo !== 'object' || !photo.url || !photo.mimeType?.startsWith('image/')) return []
      return [{
        key: `${work.id}-${index}`,
        title: work.title,
        description: work.description,
        alt: photo.alt,
        src: photo.url,
        preview: photo.url,
      }]
    }))
    return images.length ? images : fallback
  } catch (error) {
    console.error('Galerie Payload indisponible, conservation des photos du site.', error)
    return fallback
  }
}
