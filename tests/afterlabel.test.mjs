// Afterlabel at /afterlabel: the synced engine, the waitlist client, the dialog markup, prices, the analytics
// allowlist, copy hygiene and the hero visual.
import { existsSync, readdirSync, readFileSync } from 'fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { ok, eq, section, report } from './assert.mjs'

const AL = await import('./.build/afterlabel.mjs')
const { WaitlistDialogMarkup } = await import('./.build/afterlabel-waitlist.mjs')
const { RouteField } = await import('./.build/afterlabel-routefield.mjs')
const E = AL.engine

const read = (p) => readFileSync(p, 'utf8')
const filesIn = (dir, ext) => readdirSync(dir).filter((f) => ext.some((e) => f.endsWith(e))).map((f) => `${dir}/${f}`)

section('engine sync')
const ENGINE_DIR = 'src/lib/afterlabel/engine'
const EXPECTED = ['analyse', 'classify', 'csv', 'index', 'match', 'orders', 'synthetic', 'types', 'ups', 'ups-headers-250'].map((n) => `${n}.ts`)
eq('the ten engine files are present', readdirSync(ENGINE_DIR).sort(), [...EXPECTED].sort())
const shas = new Set()
for (const f of EXPECTED) {
  const first = read(`${ENGINE_DIR}/${f}`).split('\n')[0]
  const m = first.match(/^\/\/ Synced from afterlabel packages\/engine\/src\/(\S+) at ([0-9a-f]{40}) \(\d{4}-\d{2}-\d{2}\)\. Do not edit here/)
  ok(`${f} starts with the sync header naming its file and a full commit`, !!m && m[1] === f, first.slice(0, 120))
  if (m) shas.add(m[2])
}
eq('every file names the same commit', shas.size, 1)

section('engine numbers on the sample')
const d = E.generateSynthetic({ seed: E.SYNTHETIC_DEFAULT_SEED })
const r = E.analyse(E.parseUps(E.parseCSV(d.ups)).lines, { shop: E.parseShopifyOrders(E.parseCSV(d.shop)) })
eq('spend', r.totals.spend.toFixed(2), '10461.22')
eq('adjustments', r.totals.adjustments.toFixed(2), '960.96')
eq('match rate', r.matchRate.toFixed(3), '0.933')
// Printed by the afterlabel repo's own engine for the same call (and seen in Chrome on 2026-10-22).
eq('orders losing money of orders with a charge', [r.shipping.ordersLosing, r.shipping.ordersWithCharge], [356, 391])
eq('statsOf the sample is null', AL.statsOf(r, true), null)
eq('statsOf a real run', AL.statsOf(r, false), { spend: 10461, adjustmentShare: 0.092, orders: 391, losing: 356, matchedShare: 0.933 })
eq('bucket10 and lineBucket are coarse', [AL.bucket10(0.933), AL.lineBucket(50), AL.lineBucket(5000)], [90, 'lt_100', '1k_9k'])

section('waitlist client')
const fields = { email: 'shopper@example.test', store: 'shop.example.test', parcels: '300 to 1,000', carrier: 'fedex', plan: 'growth' }
const stats = { spend: 4210, adjustmentShare: 0.123, orders: 420, losing: 88, matchedShare: 0.97 }
eq('buildPayload', AL.buildPayload(fields, stats), {
  kind: 'afterlabel_waitlist',
  email: fields.email,
  store: fields.store,
  parcels: '300 to 1,000',
  carrier: 'fedex',
  plan: 'growth',
  offer: 'first 3 months half price',
  stats,
  page: '/afterlabel',
})
eq('unknown plan becomes undecided', AL.buildPayload({ ...fields, plan: 'enterprise' }, null).plan, 'undecided')
eq('unknown parcels becomes empty', AL.buildPayload({ ...fields, parcels: 'a lot' }, null).parcels, '')
eq('unknown carrier becomes empty', AL.buildPayload({ ...fields, carrier: 'Royal Mail' }, null).carrier, '')
eq('carrier ids', AL.CARRIER_IDS, ['ups', 'fedex', 'dhl', 'usps', 'other'])
eq('store is cut to 200', AL.buildPayload({ ...fields, store: 'x'.repeat(250) }, null).store.length, 200)
eq('null stats pass through', AL.buildPayload(fields, null).stats, null)

const io = (res) => {
  const calls = { fetched: [], navigated: [] }
  return {
    calls,
    io: {
      fetch: async (url, init) => {
        calls.fetched.push({ url, init })
        if (res === 'throw') throw new Error('offline')
        return res
      },
      navigate: (href) => calls.navigated.push(href),
      contact: 'hello@example.test',
    },
  }
}
const payload = AL.buildPayload(fields, stats)
let t = io({ ok: true })
eq('2xx is sent', await AL.submitWaitlist(payload, t.io), 'sent')
eq('posts JSON to /api/contact', [t.calls.fetched[0].url, t.calls.fetched[0].init.method, JSON.parse(t.calls.fetched[0].init.body).plan], ['/api/contact', 'POST', 'growth'])
eq('sent does not navigate', t.calls.navigated.length, 0)
t = io({ ok: false })
eq('non-2xx is mailto', await AL.submitWaitlist(payload, t.io), 'mailto')
const href = t.calls.navigated[0] ?? ''
ok('mailto goes to the contact address with a subject', href.startsWith('mailto:hello@example.test?subject='), href.slice(0, 60))
const body = decodeURIComponent(href.split('&body=')[1] ?? '')
for (const part of [fields.email, fields.store, '300 to 1,000', 'Carrier: FedEx', 'Growth, $39 a month', 'first 3 months half price', 'Orders found: 420'])
  ok(`mailto body has "${part}"`, body.includes(part))
t = io('throw')
eq('a network error is mailto', await AL.submitWaitlist(payload, t.io), 'mailto')
t = io({ ok: false })
t.io.contact = ''
eq('no contact address is failed', await AL.submitWaitlist(payload, t.io), 'failed')

section('dialog markup')
const html = renderToStaticMarkup(
  createElement(WaitlistDialogMarkup, {
    state: { form: { email: '', store: '', parcels: '', carrier: '', plan: 'undecided', website: '' }, error: '', invalid: false, sending: false, done: null },
    contact: 'hello@example.test',
  }),
)
const notice = html.indexOf('id="wl-notice"')
ok('notice comes before the first input', notice > 0 && notice < html.indexOf('<input'))
ok('notice comes before the first select', notice < html.indexOf('<select'))
const noticeText = html.slice(notice, html.indexOf('</p>', notice))
for (const s of ['is being built and opens soon', 'No card is needed and nothing is charged', 'we will email you when it is ready', 'first 3 months at half price'])
  ok(`notice says "${s}"`, noticeText.includes(s))
for (const p of AL.PLANS) ok(`plan option "${p.option}"`, html.includes(`>${p.option}</option>`))
ok('carrier question is labelled', /<label for="wl-carrier"[^>]*>Which carrier do you mainly ship with\?<\/label>/.test(html))
const carrierSelect = html.slice(html.indexOf('<select id="wl-carrier"'), html.indexOf('</select>', html.indexOf('<select id="wl-carrier"')))
eq('carrier options, in order', [...carrierSelect.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map((m) => [m[1], m[2]]), [['', 'Prefer not to say'], ['ups', 'UPS'], ['fedex', 'FedEx'], ['dhl', 'DHL'], ['usps', 'USPS'], ['other', 'Other']])
ok('prefer not to say is the default', /<option value="" selected="">Prefer not to say<\/option>/.test(carrierSelect))
ok('notice comes before the carrier question', notice < html.indexOf('id="wl-carrier"'))
ok('no free text anywhere: no textarea', !html.includes('<textarea'))
eq('no free text anywhere: the only text inputs are email, store and the honeypot', [...html.matchAll(/<input[^>]*name="([^"]+)"/g)].map((m) => m[1]), ['email', 'store', 'website'])
ok('honeypot is named website and out of the tab order', /<input[^>]*name="website"[^>]*tabindex="-1"|<input[^>]*tabindex="-1"[^>]*name="website"/.test(html))
ok('labelled by the heading', html.includes('aria-labelledby="wl-h"'))
ok('described by the notice', html.includes('aria-describedby="wl-notice"'))
ok('small print links the privacy notice', html.includes('href="/privacy"'))

section('pricing')
eq('plan ids', AL.PLANS.map((p) => p.id), ['starter', 'growth', 'scale'])
eq('prices', AL.PLANS.map((p) => p.price), [19, 39, 79])
ok('limits name 500, 2,000 and 2,000', /500/.test(AL.PLANS[0].limit) && /2,000/.test(AL.PLANS[1].limit) && /2,000/.test(AL.PLANS[2].limit))
eq('trial and offer', [AL.TRIAL, AL.OFFER, AL.OFFER_LINE], ['30 days free', 'first 3 months half price', 'Join before launch: your first 3 months at half price.'])
ok('tools card states the entry price', read('src/app/tools/page.tsx').includes('$19 a month after 30 days free'))

section('analytics allowlist')
const ALLOWED = [
  "track('afterlabel_sample_run')",
  "track('afterlabel_real_run', { has_shopify: !!r.hasShopify, has_shipstation: !!S.ss, ups_variant: S.parsed.variant.id, match_rate: bucket10(r.matchRate), line_count: lineBucket(r.lines.total) })",
  "track('afterlabel_no_charges')",
  "track('afterlabel_mapper_change', { field: key })",
  "track('afterlabel_csv_download')",
  "track('afterlabel_pricing_view')",
  "track('afterlabel_subscribe_click', { plan })",
  "track('afterlabel_waitlist_open', { source })",
  "track('afterlabel_waitlist_submit', { plan, parcels: parcels || 'not_given', carrier: carrier || 'not_given', result })",
]
const SOURCES = [...filesIn('src/app/afterlabel', ['.tsx', '.ts']), ...filesIn('src/lib/afterlabel', ['.ts'])]
const calls = []
for (const f of SOURCES) {
  const src = read(f)
  for (const m of src.matchAll(/(?<![\w.])track\(/g)) {
    let i = m.index + m[0].length
    let depth = 1
    while (depth && i < src.length) (depth += src[i] === '(' ? 1 : src[i] === ')' ? -1 : 0), i++
    calls.push(src.slice(m.index, i))
  }
}
eq('every call site is on the list, and only those', [...calls].sort(), [...ALLOWED].sort())
const leaky = SOURCES.filter((f) => /track\([^)]*(email|store|\.name|files\[|text\(\)|fd\.get|stats)/.test(read(f)))
eq('no track() call carries email, store, names, file text or stats', leaky, [])
ok('nothing calls gtag directly', SOURCES.every((f) => !read(f).includes('gtag')))

section('cookie-free counter call sites')
const COUNTS = [
  "count('afterlabel_sample_run')",
  "count('afterlabel_real_run')",
  "count('afterlabel_pricing_view')",
  "count('afterlabel_subscribe_click', plan)",
  "count('afterlabel_waitlist_submit', plan, carrier)",
]
const countCalls = SOURCES.filter((f) => !f.endsWith('/count.ts')).flatMap((f) => [...read(f).matchAll(/(?<![\w.])count\([^)]*\)/g)].map((m) => m[0]))
eq('every count() call site is on the list, and only those', [...countCalls].sort(), [...COUNTS].sort())
const counter = read('src/lib/afterlabel/count.ts')
ok('the counter touches no cookie, storage, location or referrer', !/document\.cookie|localStorage|sessionStorage|location\.|document\.referrer/.test(counter))

section('hygiene')
const HYGIENE = [...SOURCES, ...filesIn(ENGINE_DIR, ['.ts']), 'src/app/tools/page.tsx']
for (const [name, re, files] of [
  ['em dash', /\u2014/, HYGIENE],
  ['model or vendor name', /claude|anthropic/i, HYGIENE],
  ['personal or employer name', /(?<!cr)aakash|ravindranath|chavan|enviolo/i, HYGIENE],
]) {
  const hits = files.filter((f) => re.test(read(f)))
  eq(`no ${name}`, hits, [])
}
const cfg = read('next.config.mjs')
ok('next.config redirects /afterlabel.html permanently', /source: '\/afterlabel\.html', destination: '\/afterlabel', permanent: true/.test(cfg))
ok('next.config has no rewrites', !/rewrites/.test(cfg))
ok('the static page is gone', !existsSync('public/afterlabel.html') && !existsSync('public/afterlabel'))
ok('footer links the tool', read('src/components/Footer.tsx').includes("{ title: 'Afterlabel', href: '/afterlabel' }"))

section('privacy notice')
const priv = read('src/app/privacy/page.tsx')
ok('the page exists with canonical /privacy', priv.includes("path: '/privacy'"))
ok('the owner note was not published', !/Owner note|Remove this note|Planned, remove/i.test(priv))
for (const [name, re] of [['em dash', /\u2014/], ['model or vendor name', /claude|anthropic/i], ['personal or employer name', /(?<!cr)aakash|ravindranath|chavan|enviolo/i]])
  ok(`privacy page has no ${name}`, !re.test(priv))
for (const f of ['src/components/Footer.tsx', 'src/components/ConsentBanner.tsx', 'src/app/contact/page.tsx', 'src/app/afterlabel/Waitlist.tsx'])
  ok(`${f} links /privacy`, read(f).includes('href="/privacy"'))
ok('sitemap lists /privacy', read('src/app/sitemap.ts').includes("path: '/privacy'"))

section('hero')
const rf = renderToStaticMarkup(createElement(RouteField))
eq('six trucks, each with its own period', (rf.match(/class="rf-truck" style="--d:\d+s/g) ?? []).length, 6)
eq('six trailing segments', (rf.match(/class="rf-head"/g) ?? []).length, 6)
eq('six arrival rings', (rf.match(/class="rf-ring"/g) ?? []).length, 6)
ok('hidden from assistive tech', rf.startsWith('<div aria-hidden="true"'))
ok('reduced motion stops every animation', /@media \(prefers-reduced-motion: reduce\) \{[^}]*animation: none/.test(rf))
ok('no offset-path support hides trucks and rings', rf.includes('@supports not (offset-path'))
ok('no script in the hero', !/<script|requestAnimationFrame/.test(read('src/app/afterlabel/RouteField.tsx')))

report()
