// The cookie-free Afterlabel counter: /api/count accepts only listed events and values, caps the body, forwards
// {kind, e, p, c} and nothing about the request; the browser side sends only e, p and c.
import { ok, eq, section, report } from './assert.mjs'

const { POST } = await import('./.build/count-route.mjs')
const AL = await import('./.build/afterlabel.mjs')

const HOOK = { CONTACT_WEBHOOK_URL: 'https://hook.test/x', CONTACT_WEBHOOK_TOKEN: 'tok' }

const call = async (body, env = HOOK, fetchImpl, headers = {}) => {
  for (const k of ['CONTACT_WEBHOOK_URL', 'CONTACT_WEBHOOK_TOKEN', 'RESEND_API_KEY']) delete process.env[k]
  Object.assign(process.env, env)
  const sent = []
  globalThis.fetch = async (url, init) => {
    sent.push({ url, init, body: JSON.parse(init.body) })
    return fetchImpl ? fetchImpl() : new Response('{}', { status: 200 })
  }
  const res = await POST(
    new Request('https://analyticascent.com/api/count', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'Mozilla/5.0 TestBrowser',
        'CF-Connecting-IP': '203.0.113.7',
        'X-Forwarded-For': '203.0.113.7',
        Referer: 'https://analyticascent.com/afterlabel?email=x',
        ...headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
  return { status: res.status, text: await res.text(), sent }
}

section('same site only')
let x = await call({ e: 'afterlabel_sample_run' }, HOOK, undefined, { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.test' })
eq('a cross-site beacon is 403 and not forwarded', [x.status, x.sent.length], [403, 0])
x = await call({ e: 'afterlabel_sample_run' }, HOOK, undefined, { Origin: 'https://evil.test' })
eq('a foreign Origin without fetch metadata is 403', [x.status, x.sent.length], [403, 0])
x = await call({ e: 'afterlabel_sample_run' }, HOOK, undefined, { 'Sec-Fetch-Site': 'same-origin', Origin: 'https://analyticascent.com' })
eq('this site is accepted', x.status, 204)

section('allowlist')
let r = await call({ e: 'afterlabel_sample_run', p: '', c: '' })
eq('a listed event is 204 with no body', [r.status, r.text], [204, ''])
r = await call({ e: 'afterlabel_subscribe_click', p: 'growth' })
eq('missing c is fine', r.status, 204)
for (const e of AL.COUNT_EVENTS) eq(`${e} is accepted`, (await call({ e, p: '', c: '' })).status, 204)
for (const [why, body] of [
  ['unknown event', { e: 'afterlabel_waitlist_open', p: '', c: '' }],
  ['no event', { p: 'growth', c: '' }],
  ['unknown plan', { e: 'afterlabel_subscribe_click', p: 'enterprise', c: '' }],
  ['unknown carrier', { e: 'afterlabel_waitlist_submit', p: 'growth', c: 'royal mail' }],
  ['a number for a value', { e: 'afterlabel_sample_run', p: 1, c: '' }],
  ['an extra key', { e: 'afterlabel_sample_run', p: '', c: '', email: 'a@b.test' }],
  ['an array', ['afterlabel_sample_run']],
  ['not JSON', 'e=afterlabel_sample_run'],
]) {
  r = await call(body)
  eq(`${why} is 400`, r.status, 400)
  eq(`${why} forwards nothing`, r.sent.length, 0)
}

section('size cap')
const big = JSON.stringify({ e: 'afterlabel_sample_run', p: '', c: '', x: 'y'.repeat(200) })
r = await call(big)
eq('a body over 200 bytes is 413', r.status, 413)
eq('oversize forwards nothing', r.sent.length, 0)
r = await call({ e: 'afterlabel_sample_run' }, HOOK, undefined, { 'Content-Length': '5000' })
eq('a declared length over 200 is 413', r.status, 413)
const longest = AL.countBody('afterlabel_subscribe_click', 'undecided', 'fedex')
ok('the longest legal body fits the cap', new TextEncoder().encode(longest).length <= AL.COUNT_MAX_BYTES, `${longest.length} bytes`)

section('forward shape')
r = await call({ e: 'afterlabel_waitlist_submit', p: 'scale', c: 'dhl' })
eq('one webhook call to the configured URL', [r.sent.length, r.sent[0].url], [1, HOOK.CONTACT_WEBHOOK_URL])
eq('forwarded body is exactly token, kind, e, p, c', r.sent[0].body, { token: 'tok', kind: 'afterlabel_count', e: 'afterlabel_waitlist_submit', p: 'scale', c: 'dhl' })
const wire = JSON.stringify(r.sent[0])
ok('no IP is forwarded', !wire.includes('203.0.113.7'))
ok('no user agent is forwarded', !/TestBrowser|Mozilla/.test(wire))
ok('no referrer is forwarded', !wire.includes('email=x') && !/referer/i.test(wire))
eq('only Content-Type goes in the forwarded headers', Object.keys(r.sent[0].init.headers), ['Content-Type'])

section('delivery')
r = await call({ e: 'afterlabel_sample_run', p: '', c: '' }, {})
eq('no webhook configured is 503 and forwards nothing', [r.status, r.sent.length], [503, 0])
r = await call({ e: 'afterlabel_sample_run', p: '', c: '' }, HOOK, () => new Response('no', { status: 500 }))
eq('webhook failure is 502', r.status, 502)

section('client')
const beacons = []
AL.count('afterlabel_subscribe_click', 'growth', '', { sendBeacon: (url, data) => (beacons.push({ url, data }), true) })
eq('one beacon to /api/count', [beacons.length, beacons[0].url], [1, '/api/count'])
eq('beacon body has only e, p and c', Object.keys(JSON.parse(beacons[0].data)).sort(), ['c', 'e', 'p'])
eq('beacon body values', JSON.parse(beacons[0].data), { e: 'afterlabel_subscribe_click', p: 'growth', c: '' })
eq('a value off the list is sent empty', JSON.parse(AL.countBody('afterlabel_waitlist_submit', 'enterprise', 'royal mail')), { e: 'afterlabel_waitlist_submit', p: '', c: '' })
const fetched = []
AL.count('afterlabel_sample_run', '', '', {
  sendBeacon: () => false,
  fetch: async (url, init) => (fetched.push({ url, init }), new Response(null, { status: 503 })),
})
eq('a refused beacon falls back to fetch', fetched.length, 1)
eq('fetch is keepalive, no credentials, same body shape', [fetched[0].url, fetched[0].init.keepalive, fetched[0].init.credentials, Object.keys(JSON.parse(fetched[0].init.body)).sort()], ['/api/count', true, 'omit', ['c', 'e', 'p']])
let threw = false
try {
  AL.count('afterlabel_sample_run', '', '', { sendBeacon: () => { throw new Error('x') }, fetch: () => { throw new Error('y') } })
  AL.count('afterlabel_sample_run', '', '', {})
} catch {
  threw = true
}
ok('count never throws', !threw)

report()
