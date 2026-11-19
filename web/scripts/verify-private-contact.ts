import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// Next handles the server-only marker in its bundler. This test runs in plain Node.
registerHooks({
  resolve: (specifier, context, next) => specifier === 'server-only' ? { url: 'data:text/javascript,export{}', shortCircuit: true } : next(specifier, context),
})

process.env.CONTACT_PUBLIC_ORIGIN = 'http://localhost:3000'
process.env.RESEND_API_KEY = 'test-only'
process.env.CONTACT_FROM_EMAIL = 'atelier@example.test'
process.env.CONTACT_TO_EMAIL = 'marie@example.test'

const { POST } = await import('../src/app/api/private-contact/route.ts')
const origin = process.env.CONTACT_PUBLIC_ORIGIN
const valid = { prenom: 'Test UNICA', email: 'client@example.test', message: 'Atelier de groupe de démonstration.', date: '2028-02-29', effectif: '8', lieu: 'Lieu de test' }
let providerCalls = 0
let accept = false
const realFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  providerCalls++
  assert.equal(input, 'https://api.resend.com/emails')
  assert.equal(init?.method, 'POST')
  const payload = JSON.parse(String(init?.body))
  assert.deepEqual(payload.to, ['marie@example.test'])
  assert.equal(payload.reply_to, valid.email)
  assert.match(payload.text, /Nombre de participants : 8/)
  return new Response(null, { status: accept ? 200 : 503 })
}

const submit = (data: unknown, requestOrigin = origin) => POST(new Request(origin + '/api/private-contact/', {
  method: 'POST',
  headers: { origin: requestOrigin, 'content-type': 'application/json' },
  body: JSON.stringify(data),
}))

try {
  assert.equal((await submit(valid, 'https://example.test')).status, 403)
  assert.equal((await submit({ ...valid, website: 'spam' })).status, 400)
  assert.equal((await submit({ ...valid, date: '2027-02-29' })).status, 400)
  assert.equal((await submit({ ...valid, effectif: '1.5' })).status, 400)
  assert.equal((await submit({ ...valid, email: 'invalid' })).status, 400)
  assert.equal((await submit({ ...valid, message: 'x'.repeat(25_000) })).status, 413)
  assert.equal(providerCalls, 0)

  const rejected = await submit(valid)
  assert.equal(rejected.status, 502)
  assert.notEqual((await rejected.json()).sent, true)
  accept = true
  assert.deepEqual(await (await submit(valid)).json(), { sent: true })
  for (let i = 0; i < 3; i++) assert.equal((await submit(valid)).status, 200)
  const limited = await submit(valid)
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '60')
  assert.equal(providerCalls, 5)

  delete process.env.RESEND_API_KEY
  assert.equal((await submit(valid)).status, 503)
  assert.equal(providerCalls, 5)
  console.log('Atelier privé : validation, erreurs, débit, acceptation simulée et repli vérifiés.')
} finally {
  globalThis.fetch = realFetch
}
