// The Afterlabel waitlist branch of /api/contact: validation, honeypot, delivery routes, and that a
// normal enquiry still takes the old path.
import { ok, eq, section, report } from './assert.mjs'

const { POST } = await import('./.build/route.mjs')

const GOOD = {
  kind: 'afterlabel_waitlist',
  email: 'shopper@example.test',
  store: 'shop.example.test',
  parcels: '300 to 1,000',
  plan: 'growth',
  offer: 'first 3 months half price',
  stats: { spend: 4210, adjustmentShare: 0.123, orders: 420, losing: 88, matchedShare: 0.97 },
  page: '/afterlabel',
}

const call = async (body, env = {}, fetchImpl) => {
  for (const k of ['CONTACT_WEBHOOK_URL', 'CONTACT_WEBHOOK_TOKEN', 'RESEND_API_KEY']) delete process.env[k]
  Object.assign(process.env, env)
  const sent = []
  globalThis.fetch = async (url, init) => {
    sent.push({ url, body: JSON.parse(init.body) })
    return fetchImpl ? fetchImpl() : new Response('{}', { status: 200 })
  }
  const res = await POST(new Request('https://analyticascent.com/api/contact', { method: 'POST', body: JSON.stringify(body) }))
  return { status: res.status, json: await res.json(), sent }
}

section('validation')
let r = await call({ ...GOOD, email: 'nope' })
eq('bad email is 400', r.status, 400)
r = await call({ ...GOOD, email: 'a'.repeat(200) + '@example.test' })
eq('email over 200 chars is 400', r.status, 400)
r = await call({ ...GOOD, store: 'x'.repeat(201) })
eq('store over 200 chars is 400', r.status, 400)
r = await call({ ...GOOD, store: 'shop.test <script>' })
eq('store with markup is 400', r.status, 400)
r = await call({ ...GOOD, parcels: 'a lot' })
eq('unknown parcels band is 400', r.status, 400)
r = await call({ ...GOOD, plan: 'enterprise' })
eq('unknown plan is 400', r.status, 400)
r = await call({ ...GOOD, stats: 'x' })
eq('stats that are not an object are 400', r.status, 400)

section('honeypot')
r = await call({ ...GOOD, website: 'http://spam.test' }, { CONTACT_WEBHOOK_URL: 'https://hook.test/x' })
eq('honeypot answers 200 ok', [r.status, r.json.ok], [200, true])
eq('honeypot forwards nothing', r.sent.length, 0)

section('delivery')
r = await call(GOOD)
eq('nothing configured is 503 not-configured', [r.status, r.json.code], [503, 'not-configured'])
r = await call(GOOD, { CONTACT_WEBHOOK_URL: 'https://hook.test/x', CONTACT_WEBHOOK_TOKEN: 'tok' })
eq('webhook route returns 200', [r.status, r.json.ok], [200, true])
eq('one webhook call', r.sent.length, 1)
const w = r.sent[0].body
eq('webhook gets the kind, token and plan', [w.kind, w.token, w.plan], ['afterlabel_waitlist', 'tok', 'growth'])
eq('webhook gets email, store, parcels, offer', [w.email, w.store, w.parcels, w.offer], [GOOD.email, GOOD.store, GOOD.parcels, GOOD.offer])
eq('webhook gets stats intact', w.stats, GOOD.stats)
ok('webhook gets a notification subject and text', /Afterlabel waitlist/.test(w.subject) && w.text.includes(GOOD.email))
r = await call({ ...GOOD, stats: null }, { CONTACT_WEBHOOK_URL: 'https://hook.test/x' })
eq('null stats stay null', r.sent[0].body.stats, null)
r = await call({ ...GOOD, stats: { spend: 1, extra: 'drop me' } }, { CONTACT_WEBHOOK_URL: 'https://hook.test/x' })
eq('unknown stat keys are dropped', r.sent[0].body.stats, { spend: 1 })
r = await call(GOOD, { CONTACT_WEBHOOK_URL: 'https://hook.test/x' }, () => new Response('no', { status: 500 }))
eq('webhook failure is 502 delivery-failed', [r.status, r.json.code], [502, 'delivery-failed'])

section('normal enquiries are unchanged')
const ENQ = { name: 'A Person', email: 'a@example.test', message: 'We have a problem with lead times.' }
r = await call(ENQ, { CONTACT_WEBHOOK_URL: 'https://hook.test/x' })
eq('enquiry returns 200', [r.status, r.json.ok], [200, true])
ok('enquiry payload has no kind', !('kind' in r.sent[0].body))
eq('enquiry subject is the old heading', r.sent[0].body.subject, 'Enquiry from analyticascent.com')
r = await call({ email: 'a@example.test', message: 'too short' }, { CONTACT_WEBHOOK_URL: 'https://hook.test/x' })
eq('enquiry without a name is still 400', r.status, 400)

report()
