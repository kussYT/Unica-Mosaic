import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatEuros } from '@/lib/calendar'
import { pageMeta } from '@/lib/meta'
import { getPublishedProducts } from '@/lib/products'
import '@/styles/shop.css'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const [product] = await getPublishedProducts(slug)
  return product ? pageMeta(product.title, product.description) : {}
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product] = await getPublishedProducts(slug)
  if (!product) notFound()
  return (
    <section className="wrap shop-page">
      <Link href="/boutique/" className="text-link">← Tous les kits</Link>
      <div className="shop-product">
        <div>
          <p className="eyebrow">MOSAIC KIDS</p>
          <h1>{product.title}</h1>
          <p className="shop-price">{formatEuros(product.priceCents)}{product.stock === 0 ? ' · Épuisé' : ''}</p>
          <p>{product.description}</p>
          {product.recommendedAge && <p>Âge conseillé : {product.recommendedAge}</p>}
          <h2>Dans le kit</h2>
          <p className="shop-contents">{product.contents}</p>
          <p>La commande en ligne n’est pas encore ouverte.</p>
        </div>
        {product.photos.length > 0 && <div className="shop-product-photos">
          {product.photos.map((photo) => (
            <img key={photo.id} src={photo.url} alt={photo.alt} width={photo.width ?? undefined} height={photo.height ?? undefined} loading="lazy" />
          ))}
        </div>}
      </div>
    </section>
  )
}
