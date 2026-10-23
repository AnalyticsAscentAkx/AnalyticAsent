// Validation for the Afterlabel waitlist, kept free of React and Next so the node tests can bundle it.
// The client page (analyticascent.com/afterlabel) posts here through /api/contact with kind "afterlabel_waitlist".

export const WAITLIST_KIND = 'afterlabel_waitlist'

const MAX = { email: 200, store: 200, offer: 80, statsJson: 400 }
const PLANS = ['starter', 'growth', 'scale', 'undecided']
const PARCELS = ['', 'under 300', '300 to 1,000', '1,000 to 5,000', 'over 5,000']
// Empty is "prefer not to say". Same list as CARRIER_IDS in src/lib/afterlabel/waitlist-client.ts.
const CARRIERS = ['', 'ups', 'fedex', 'dhl', 'usps', 'other']
const STATS_KEYS = ['spend', 'adjustmentShare', 'orders', 'losing', 'matchedShare']

export interface WaitlistEntry {
  email: string
  store: string
  parcels: string
  carrier: string
  plan: string
  offer: string
  /** The five summary figures from the visitor's report, or null if no report was run. */
  stats: Record<string, number> | null
  page: string
}

export type WaitlistResult =
  | { ok: true; entry: WaitlistEntry }
  | { ok: false; message: string }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function validateWaitlist(body: Record<string, unknown>): WaitlistResult {
  const email = str(body.email)
  if (email.length > MAX.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return { ok: false, message: 'That email address does not look right.' }

  const store = str(body.store)
  if (store.length > MAX.store) return { ok: false, message: 'That store URL is too long.' }
  // The store is stored and mailed as plain text. Refuse anything that is not a plain address.
  if (store && /[\s<>"'`]/.test(store)) return { ok: false, message: 'That store URL does not look right.' }

  const parcels = str(body.parcels)
  if (!PARCELS.includes(parcels)) return { ok: false, message: 'Pick one of the parcel ranges.' }

  const carrier = str(body.carrier)
  if (!CARRIERS.includes(carrier)) return { ok: false, message: 'Pick one of the carriers.' }

  const plan = str(body.plan) || 'undecided'
  if (!PLANS.includes(plan)) return { ok: false, message: 'Pick one of the plans.' }

  const offer = str(body.offer).slice(0, MAX.offer)

  let stats: Record<string, number> | null = null
  if (body.stats !== null && body.stats !== undefined) {
    const raw = body.stats as Record<string, unknown>
    if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, message: 'Those figures do not look right.' }
    stats = {}
    for (const k of STATS_KEYS) {
      const v = raw[k]
      if (typeof v === 'number' && Number.isFinite(v)) stats[k] = v
    }
    if (JSON.stringify(stats).length > MAX.statsJson) return { ok: false, message: 'Those figures do not look right.' }
    if (!Object.keys(stats).length) stats = null
  }

  return { ok: true, entry: { email, store, parcels, carrier, plan, offer, stats, page: '/afterlabel' } }
}

export function waitlistText(e: WaitlistEntry): string {
  return [
    `Email:   ${e.email}`,
    `Store:   ${e.store || '(not given)'}`,
    `Parcels: ${e.parcels || '(not given)'} per month`,
    `Carrier: ${e.carrier || '(not given)'}`,
    `Plan:    ${e.plan}`,
    `Offer:   ${e.offer}`,
    `Report:  ${e.stats ? JSON.stringify(e.stats) : '(none run)'}`,
  ].join('\n')
}
