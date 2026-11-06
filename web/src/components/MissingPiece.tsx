export function MissingPiece() {
  return (
    <section className="error-page wrap">
      <p className="eyebrow">ERREUR 404</p>
      <h1>
        Il manque
        <br />
        <em>un petit morceau.</em>
      </h1>
      <p>Cette page n’existe pas ou a changé d’adresse.</p>
      <a className="button" href="/">
        Retrouver l’accueil ↗
      </a>
    </section>
  )
}
