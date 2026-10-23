// The browser side of the Afterlabel waitlist, kept free of React and of DOM globals (fetch and navigation
// are passed in) so the node tests can bundle and call it. The server side is src/lib/waitlist.ts.

import { OFFER, PLANS } from './pricing'

export const PLAN_IDS = ['starter', 'growth', 'scale', 'undecided'] as const
export const PARCEL_BANDS = ['under 300', '300 to 1,000', '1,000 to 5,000', 'over 5,000'] as const
/** Carriers a visitor can name on the waitlist. Empty means "prefer not to say". */
export const CARRIER_IDS = ['ups', 'fedex', 'dhl', 'usps', 'other'] as const
export const CARRIER_LABELS: Record<Carrier, string> = { ups: 'UPS', fedex: 'FedEx', dhl: 'DHL', usps: 'USPS', other: 'Other' }
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export type WaitlistPlan = (typeof PLAN_IDS)[number]
export type ParcelBand = (typeof PARCEL_BANDS)[number]
export type Carrier = (typeof CARRIER_IDS)[number]

/** The five summary figures a waitlist entry may carry. Null when no report was run or it was the sample. */
export interface Stats {
  spend: number
  adjustmentShare: number
  orders: number
  losing: number
  matchedShare: number
}

export interface WaitlistPayload {
  kind: 'afterlabel_waitlist'
  email: string
  store: string
  parcels: ParcelBand | ''
  /** Empty means "prefer not to say". */
  carrier: Carrier | ''
  plan: WaitlistPlan
  offer: string
  stats: Stats | null
  page: '/afterlabel'
}

export type SubmitResult = 'sent' | 'mailto' | 'failed'

const has = <T extends string>(list: readonly T[], v: string): v is T => (list as readonly string[]).includes(v)

/** Plan, parcels and carrier only ever leave as members of the fixed lists, never as the raw form value. */
export function buildPayload(
  form: { email: string; store: string; parcels: string; carrier: string; plan: string },
  stats: Stats | null,
): WaitlistPayload {
  return {
    kind: 'afterlabel_waitlist',
    email: form.email.trim(),
    store: form.store.trim().slice(0, 200),
    parcels: has(PARCEL_BANDS, form.parcels) ? form.parcels : '',
    carrier: has(CARRIER_IDS, form.carrier) ? form.carrier : '',
    plan: has(PLAN_IDS, form.plan) ? form.plan : 'undecided',
    offer: OFFER,
    stats,
    page: '/afterlabel',
  }
}

const planLabel = (plan: WaitlistPlan) => PLANS.find((p) => p.id === plan)?.option ?? 'Not sure yet'

export function mailtoBody(p: WaitlistPayload): string {
  const s = p.stats
  return [
    'Please add me to the Afterlabel for Shopify list.',
    '',
    `Email: ${p.email}`,
    `Store: ${p.store || 'not given'}`,
    `Parcels per month: ${p.parcels || 'not given'}`,
    `Carrier: ${p.carrier ? CARRIER_LABELS[p.carrier] : 'not given'}`,
    `Plan: ${planLabel(p.plan)}`,
    `Offer: ${p.offer}`,
    ...(s
      ? [
          '',
          `UPS spend in the file: $${s.spend}`,
          `Share of spend added after the label: ${(s.adjustmentShare * 100).toFixed(1)}%`,
          `Orders found: ${s.orders}`,
          `Orders that lost money on shipping: ${s.losing}`,
          `Matched to orders: ${(s.matchedShare * 100).toFixed(1)}%`,
        ]
      : []),
  ].join('\n')
}

export function mailtoHref(contact: string, p: WaitlistPayload): string {
  return `mailto:${contact}?subject=${encodeURIComponent('Afterlabel waitlist')}&body=${encodeURIComponent(mailtoBody(p))}`
}

/** POSTs to /api/contact. Any non-2xx (the route answers 503 when no delivery is configured) or a network
 *  error falls back to a prefilled email. 'failed' only when there is no address to fall back to. */
export async function submitWaitlist(
  payload: WaitlistPayload,
  io: { fetch: typeof fetch; navigate: (href: string) => void; contact: string; timeoutMs?: number },
): Promise<SubmitResult> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), io.timeoutMs ?? 12000)
  let ok = false
  try {
    const res = await io.fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: ctl.signal,
    })
    ok = res.ok
  } catch {
    ok = false
  } finally {
    clearTimeout(timer)
  }
  if (ok) return 'sent'
  if (!io.contact) return 'failed'
  io.navigate(mailtoHref(io.contact, payload))
  return 'mailto'
}
