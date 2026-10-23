// The planned Afterlabel app prices, in one place. The page, the waitlist dialog and the mailto fallback all
// read from here; the /tools card states the entry price in prose and a test checks it agrees.
// Plan ids are what the waitlist stores and what analytics reports; src/lib/waitlist.ts validates them.

export const PLANS = [
  { id: 'starter', name: 'Starter', price: 19, limit: 'Up to 500 shipments a month', option: 'Starter, $19 a month, up to 500 shipments' },
  { id: 'growth', name: 'Growth', price: 39, limit: 'Up to 2,000 shipments a month', option: 'Growth, $39 a month, up to 2,000 shipments' },
  { id: 'scale', name: 'Scale', price: 79, limit: 'Above 2,000 shipments a month', option: 'Scale, $79 a month, above 2,000 shipments' },
] as const

export type PlanId = (typeof PLANS)[number]['id']

export const TRIAL = '30 days free'
/** Payload value. Unchanged since the first version so signups stay comparable. */
export const OFFER = 'first 3 months half price'
export const OFFER_LINE = 'Join before launch: your first 3 months at half price.'
