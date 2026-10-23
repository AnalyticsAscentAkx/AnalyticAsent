import { COUNT_CARRIERS, COUNT_EVENTS, COUNT_MAX_BYTES, COUNT_PLANS } from '@/lib/afterlabel/count'

// The cookie-free Afterlabel counter (client: src/lib/afterlabel/count.ts).
//
// Accepts {e, p, c} and nothing else: e from a fixed list of events, p a plan id or empty, c a carrier id or
// empty. Anything outside the lists, any extra key, and any body over 200 bytes is refused. A good count goes
// to the same Apps Script as the contact form as {kind: "afterlabel_count", e, p, c}. Nothing about the
// request is forwarded: no IP, no user agent, no headers, no time beyond what the sheet stamps itself.
//
// 204 on success, 503 when no webhook is configured, 502 when the webhook fails. The browser ignores all of
// them; a count that is lost is lost.

export const runtime = 'edge'

const KIND = 'afterlabel_count'

const status = (s: number) => new Response(null, { status: s })

/** Reads at most limit + 1 bytes, so an oversize body is refused without being read in full. */
async function readCapped(request: Request, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > limit) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  const all = new Uint8Array(size)
  let at = 0
  for (const c of chunks) all.set(c, at), (at += c.byteLength)
  return new TextDecoder().decode(all)
}

const inList = (list: readonly string[], v: unknown): v is string => typeof v === 'string' && list.includes(v)

/** Counts are the go/no-go input, so only this site's own pages may send them. Browsers set both headers. */
function sameSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) return false
    } catch {
      return false
    }
  }
  return true
}

export async function POST(request: Request) {
  if (!sameSite(request)) return status(403)
  const raw = await readCapped(request, COUNT_MAX_BYTES)
  if (raw === null) return status(413)

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return status(400)
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return status(400)
  const b = body as Record<string, unknown>
  if (Object.keys(b).some((k) => k !== 'e' && k !== 'p' && k !== 'c')) return status(400)
  const e = b.e
  const p = b.p ?? ''
  const c = b.c ?? ''
  if (!inList(COUNT_EVENTS, e) || !inList(COUNT_PLANS, p) || !inList(COUNT_CARRIERS, c)) return status(400)

  const env = process.env
  if (!env.CONTACT_WEBHOOK_URL) return status(503)
  try {
    const r = await fetch(env.CONTACT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: env.CONTACT_WEBHOOK_TOKEN ?? '', kind: KIND, e, p, c }),
    })
    if (!r.ok) throw new Error(`webhook responded ${r.status}`)
  } catch (err) {
    console.error('count delivery failed:', err)
    return status(502)
  }
  return status(204)
}
