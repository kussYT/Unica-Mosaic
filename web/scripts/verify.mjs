const base = process.env.VERIFY_BASE_URL || 'http://127.0.0.1:3000'
const email = process.env.PAYLOAD_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD

const failures = []
const assert = (condition, message) => {
  if (!condition) failures.push(message)
}

const responseOf = async (pathname, options = {}) => {
  let current = new URL(pathname, base)
  let response = await fetch(current, { redirect: 'manual', ...options })
  for (let hop = 0; hop < 3 && [301, 302, 307, 308].includes(response.status); hop += 1) {
    const location = response.headers.get('location') || ''
    if (location.includes('/login')) break
    current = new URL(location, current)
    response = await fetch(current, { redirect: 'manual', ...options })
  }
  const text = await response.text()
  return { response, text }
}

const home = await responseOf('/')
assert(home.response.status === 200, `Accueil HTTP ${home.response.status}`)
assert(home.text.includes('<title>L’art de recoller les morceaux — UNICA Mosaïque</title>'), 'Le titre de l’accueil ne reprend pas la signature')
assert(home.text.includes('noindex'), 'Le noindex manque')
assert(home.text.includes('CHAQUE PIÈCE'), 'Le tampon du hero manque')
assert(home.text.includes('Mosaic Kids'), 'La carte Mosaic Kids manque')
assert(home.text.includes('/images/blason-960.webp'), 'La photo du blason manque')
assert(!home.text.includes('€'), 'Un prix est apparu sur l’accueil')

for (const pathname of ['/ateliers/', '/ateliers/pixel-kids/', '/realisations/', '/contact/']) {
  const page = await responseOf(pathname)
  assert(page.response.status === 200, `${pathname} HTTP ${page.response.status}`)
}

const workshop = await responseOf('/ateliers/pixel-kids/')
assert(workshop.text.includes('Calendrier et réservations bientôt disponibles.'), 'La fiche atelier promet une réservation')

const contact = await responseOf('/contact/')
assert(contact.text.includes('Aucun message ne sera envoyé.'), 'Le contact laisse croire qu’un message part')

const missing = await responseOf('/cette-page-n-existe-pas/')
assert(missing.response.status === 404, `404 HTTP ${missing.response.status}`)
assert(missing.text.includes('Il manque'), 'La page 404 ne reprend pas le texte UNICA')

const users = await responseOf('/api/users')
assert([401, 403].includes(users.response.status), `Utilisateurs anonymes HTTP ${users.response.status}`)

const mediaWrite = await responseOf('/api/media', { method: 'POST' })
assert([401, 403].includes(mediaWrite.response.status), `Upload anonyme HTTP ${mediaWrite.response.status}`)

const mediaRead = await responseOf('/api/media')
assert(mediaRead.response.status === 200, `Lecture des médias HTTP ${mediaRead.response.status}`)
assert(mediaRead.text.includes('"docs"'), 'La réponse médias ne vient pas de Payload')

const admin = await responseOf('/admin/collections/users/')
assert(admin.response.status === 200, `Admin HTTP ${admin.response.status}`)
assert(!admin.text.includes('admin@unica.local'), 'La page admin expose le compte sans authentification')
assert(!admin.text.includes('PAYLOAD_ADMIN_PASSWORD'), 'La page admin expose un secret')

if (!email || !password) {
  failures.push('Identifiants admin absents du fichier d’environnement')
} else {
  const login = await fetch(new URL('/api/users/login', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  assert(login.status === 200, `Connexion admin HTTP ${login.status}`)
  const cookie = (login.headers.getSetCookie?.() || []).map((item) => item.split(';')[0]).join('; ')
  const session = await responseOf('/api/users', { headers: { cookie } })
  assert(session.response.status === 200, `Session admin HTTP ${session.response.status}`)

  const editorPassword = `editor-${crypto.randomUUID()}`
  const created = await fetch(new URL('/api/users', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ email: 'editeur-test@unica.local', password: editorPassword, role: 'editor' }),
  })
  assert(created.status === 201, `Création éditeur HTTP ${created.status}`)
  const createdBody = await created.json()
  const editorLogin = await fetch(new URL('/api/users/login', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'editeur-test@unica.local', password: editorPassword }),
  })
  assert(editorLogin.status === 200, `Connexion éditeur HTTP ${editorLogin.status}`)
  const editorCookie = (editorLogin.headers.getSetCookie?.() || []).map((item) => item.split(';')[0]).join('; ')
  const forbidden = await fetch(new URL('/api/users', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: editorCookie },
    body: JSON.stringify({ email: 'autre@unica.local', password: editorPassword, role: 'admin' }),
  })
  assert([401, 403].includes(forbidden.status), `Un éditeur a pu créer un utilisateur HTTP ${forbidden.status}`)
  if (createdBody?.doc?.id) {
    const removed = await fetch(new URL(`/api/users/${createdBody.doc.id}`, base), { method: 'DELETE', headers: { cookie } })
    assert(removed.status === 200, `Suppression de l’éditeur de test HTTP ${removed.status}`)
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Vérifications lot 1 réussies')
