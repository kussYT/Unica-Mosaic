import { getPayload } from 'payload'
import config from '@payload-config'

export async function getPublishedProducts(slug?: string) {
  if (!process.env.PAYLOAD_SECRET || !process.env.DATABASE_URL) return []
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    draft: false,
    depth: 1,
    pagination: false,
    sort: 'title',
    ...(slug ? { where: { slug: { equals: slug } } } : {}),
  })
  return docs.map((item) => ({
    ...item,
    photos: (item.photos ?? []).flatMap((photo) =>
      typeof photo === 'object' && photo.url && photo.mimeType?.startsWith('image/')
        ? [{ id: photo.id, url: photo.url, alt: photo.alt, width: photo.width, height: photo.height }]
        : [],
    ),
  }))
}
