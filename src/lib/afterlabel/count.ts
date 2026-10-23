// The cookie-free counter for Afterlabel. A few key events are counted whatever the visitor chose on the cookie
// banner, because the count holds no personal data: the event name, the plan and the carrier, each a member of a
// fixed list, and nothing else. No cookie, no storage, no id, no page address, no referrer. The server side is
// src/app/api/count/route.ts, which checks the same lists. Kept free of React and of DOM globals (the beacon and
// fetch are passed in) so the node tests can bundle and call it.

import { CARRIER_IDS, PLAN_IDS } from './waitlist-client'

export const COUNT_URL = '/api/count'
export const COUNT_EVENTS = [
  'afterlabel_sample_run',
  'afterlabel_real_run',
  'afterlabel_pricing_view',
  'afterlabel_subscribe_click',
  'afterlabel_waitlist_submit',
] as const
export const COUNT_PLANS = ['', ...PLAN_IDS] as const
export const COUNT_CARRIERS = ['', ...CARRIER_IDS] as const
/** Bodies over this many bytes are refused by the route. The longest legal body is well under it. */
export const COUNT_MAX_BYTES = 200

export type CountEvent = (typeof COUNT_EVENTS)[number]

const has = (list: readonly string[], v: string) => list.includes(v)

/** The whole body that leaves the browser. Values not on the lists become empty. */
export function countBody(e: CountEvent, p = '', c = ''): string {
  return JSON.stringify({ e, p: has(COUNT_PLANS, p) ? p : '', c: has(COUNT_CARRIERS, c) ? c : '' })
}

interface CountIo {
  sendBeacon?: (url: string, data: string) => boolean
  fetch?: typeof fetch
}

function browserIo(): CountIo {
  if (typeof window === 'undefined') return {}
  return {
    sendBeacon: typeof navigator.sendBeacon === 'function' ? navigator.sendBeacon.bind(navigator) : undefined,
    fetch: typeof window.fetch === 'function' ? window.fetch.bind(window) : undefined,
  }
}

/** Sends one count. Never throws and never waits: a failed count is lost, not retried.
 *  The body goes as text/plain, which a beacon may send without a preflight; the route parses it as JSON. */
export function count(e: CountEvent, p = '', c = '', io: CountIo = browserIo()): void {
  const body = countBody(e, p, c)
  try {
    if (io.sendBeacon?.(COUNT_URL, body)) return
  } catch {
    // fall through to fetch
  }
  try {
    io.fetch?.(COUNT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      keepalive: true,
      credentials: 'omit',
    })?.catch(() => {})
  } catch {
    // ignore
  }
}
