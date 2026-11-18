import Stripe from 'stripe'

export const CHECKOUT_HOLD_MINUTES = 30

export const stripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY || ''
  return key.startsWith('sk_test_')
}

export const stripeLiveKeyRejected = () => {
  const key = process.env.STRIPE_SECRET_KEY || ''
  return key.startsWith('sk_live_')
}

export const getStripe = () => {
  if (stripeLiveKeyRejected()) {
    throw new Error('Les clés Stripe live sont interdites sur ce projet pour le moment.')
  }
  if (!stripeConfigured()) {
    throw new Error('Configurez STRIPE_SECRET_KEY avec une clé de test (sk_test_…).')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    typescript: true,
  })
}

export const siteUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://127.0.0.1:3000'
  return raw.replace(/\/$/, '')
}
