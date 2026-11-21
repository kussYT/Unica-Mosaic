import Link from 'next/link'

const actions = [
  { title: 'Ateliers et tarifs', description: 'Modifier une fiche, un prix ou un acompte.', href: '/admin/collections/workshops' },
  { title: 'Dates et places', description: 'Ajouter une date ou ajuster sa capacité.', href: '/admin/collections/sessions' },
  { title: 'Réservations', description: 'Voir les inscriptions, les acomptes et les soldes.', href: '/admin/collections/reservations' },
  { title: 'Réalisations', description: 'Ajouter des photos, changer leur ordre et publier une œuvre.', href: '/admin/collections/realisations', create: 'Ajouter une réalisation' },
  { title: 'Kit Pixel Kids', description: 'Modifier la fiche, les photos, le prix et le stock du kit.', href: '/admin/collections/products' },
]

export function MarieDashboard() {
  return (
    <section className="unica-admin-home" aria-labelledby="unica-admin-title">
      <p className="unica-admin-eyebrow">UNICA MOSAÏQUE</p>
      <h1 id="unica-admin-title">L’atelier de Marie</h1>
      <p>Les raccourcis pour mettre ton site à jour.</p>
      <Link className="unica-admin-primary" href="/admin/collections/sessions/create">
        Ajouter une date
      </Link>
      <ul className="unica-admin-grid">
        {actions.map(({ title, description, href, create }) => (
          <li key={href} className="unica-admin-card">
            <h2><Link href={href}>{title}</Link></h2>
            <p>{description}</p>
            {create && <Link href={href + '/create'}>{create} <span aria-hidden="true">↗</span></Link>}
          </li>
        ))}
      </ul>
    </section>
  )
}
