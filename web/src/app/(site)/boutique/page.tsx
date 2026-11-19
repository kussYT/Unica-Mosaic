import Link from 'next/link'
import { formatEuros } from '@/lib/calendar'
import { pageMeta } from '@/lib/meta'
import { getPublishedProducts } from '@/lib/products'
import '@/styles/shop.css'

export const dynamic = 'force-dynamic'
export const metadata = pageMeta('Boutique Mosaic Kids', 'Découvrez les kits de mosaïque Mosaic Kids.')

export default async function ShopPage() {
  const products = await getPublishedProducts()
  return (
    <section className="wrap shop-page">
      <header className="shop-heading">
        <p className="eyebrow">LA BOUTIQUE UNICA</p>
        <h1>Mosaic Kids</h1>
        <p>Des kits pour créer une mosaïque à la maison.</p>
      </header>
      {products.length ? (
        <ul className="shop-grid">
          {products.map((product) => (
            <li key={product.id}>
              <Link href={`/boutique/${product.slug}/`} className="shop-card">
                {product.photos[0] && <img src={product.photos[0].url} alt={product.photos[0].alt} loading="lazy" />}
                <div>
                  <h2>{product.title}</h2>
                  <p>{formatEuros(product.priceCents)}{product.stock === 0 ? ' · Épuisé' : ''}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="shop-empty">
          <h2>Les kits arrivent.</h2>
          <p>Les kits Mosaic Kids seront présentés ici dès leur publication.</p>
          <Link href="/ateliers/pixel-kids/" className="text-link">Découvrir l’atelier Pixel Kids</Link>
        </div>
      )}
    </section>
  )
}
