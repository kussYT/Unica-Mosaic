import { privateContactConfig } from '@/lib/private-contact'

const maxBodyBytes = 24_000
const windowMs = 60_000
let windowStart = 0
let attempts = 0

export async function POST(request: Request) {
  const config = privateContactConfig()
  if (!config) return Response.json({ error: 'Envoi indisponible.' }, { status: 503 })

  const origin = process.env.CONTACT_PUBLIC_ORIGIN || new URL(request.url).origin
  if (request.headers.get('origin') !== origin || !request.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({ error: 'Requête non autorisée.' }, { status: 403 })
  }

  const reader = request.body?.getReader()
  const decoder = new TextDecoder()
  let body = ''
  let size = 0
  if (!reader) return Response.json({ error: 'Formulaire vide.' }, { status: 400 })
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBodyBytes) {
        await reader.cancel()
        return Response.json({ error: 'Demande trop longue.' }, { status: 413 })
      }
      body += decoder.decode(value, { stream: true })
    }
    body += decoder.decode()
  } catch {
    return Response.json({ error: 'Formulaire illisible.' }, { status: 400 })
  }

  let values: Record<string, unknown>
  try {
    const parsed = JSON.parse(body)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    values = parsed
  } catch {
    return Response.json({ error: 'Formulaire illisible.' }, { status: 400 })
  }

  const read = (key: string) => typeof values[key] === 'string' ? values[key].trim() : ''
  const name = read('prenom')
  const email = read('email')
  const message = read('message')
  const date = read('date')
  const sizeText = read('effectif')
  const place = read('lieu')
  if (
    read('website') || !name || name.length > 80 || email.length > 200 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    message.length < 10 || message.length > 4000 || place.length > 160 ||
    (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date)) ||
    (sizeText && (!/^\d+$/.test(sizeText) || !Number.isSafeInteger(Number(sizeText)) || Number(sizeText) < 1))
  ) {
    return Response.json({ error: 'Vérifiez les informations de votre demande.' }, { status: 400 })
  }

  const now = Date.now()
  if (now - windowStart >= windowMs) {
    windowStart = now
    attempts = 0
  }
  if (attempts >= 5) {
    return Response.json({ error: 'Réessayez dans une minute.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }
  attempts += 1

  const text = [
    'Demande d’atelier privé',
    name,
    email,
    date && 'Date souhaitée : ' + date,
    sizeText && 'Nombre de participants : ' + sizeText,
    place && 'Lieu envisagé : ' + place,
    message,
  ].filter(Boolean).join('\n\n')

  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + config.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.from, to: [config.to], reply_to: email,
        subject: 'UNICA — demande d’atelier privé', text,
      }),
      signal: AbortSignal.timeout(8_000),
    })
    if (result.ok) return Response.json({ sent: true })
  } catch {
    // The form keeps a downloadable draft when the provider is unavailable.
  }
  return Response.json({ error: 'L’envoi a échoué. Votre brouillon est disponible.' }, { status: 502 })
}
