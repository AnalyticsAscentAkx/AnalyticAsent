// Really European? — the ownership audit behind /really-european, its checker,
// the per-company answer pages, the badges and /dora/providers.
//
// Every number shown on those pages is computed here from the published rows
// (src/data/really-european.json, the same file served at
// /data/really-european.json). Nothing is typed in, so a re-run of the data
// cannot leave a stale headline behind.
//
// The evidence rule the data was built under: a row says EU-, non-EU- or
// PE-controlled only when a primary document is linked in source_url with the
// date it was checked. Everything else is "unverified". The helpers below never
// promote a row; GLEIF parents in particular are self-reported and are shown
// beside the verified owner, never in place of it.

import data from '@/data/really-european.json'

import { VERDICT_LABEL, type Verdict } from '@/lib/really-european-labels'

export { VERDICT_LABEL, type Verdict }
export type ListKind = 'directory' | 'dora-provider' | 'both'

export interface Row {
  slug: string
  product: string
  legal_entity: string
  registry_id: string
  country: string
  lei: string
  lei_status: string
  lei_renewal: string
  gleif_parent: string
  owner: string
  owner_country: string
  control_type: string
  verdict: Verdict
  source_url: string
  checked_on: string
  list: ListKind
  listed_on: string[]
  ctpp_rollup: string
  confidence: string
  notes: string
  category: string
  website: string
  search_score: number
  listing_urls: Record<string, string>
}

export interface Meta {
  title: string
  publisher: string
  license: string
  license_url: string
  version: string
  checked_on: string
  directories: string[]
  evidence_rule: string
  changelog: { date: string; entry: string }[]
}

export const META = data.meta as Meta
export const ROWS = data.rows as Row[]

export const PATH = '/really-european'
export const CSV_PATH = '/data/really-european.csv'
export const JSON_PATH = '/data/really-european.json'
export const DATASET_NAME = 'Really European? Ownership of the products on Europe’s buy-European directories'

export const VERDICT_LINE: Record<Verdict, string> = {
  'eu-controlled': 'A primary document names a controlling owner based in the EU.',
  'non-eu-controlled': 'A primary document names a controlling owner based outside the EU. That includes Switzerland, the UK and Norway.',
  'pe-controlled': 'A primary document names a private-equity fund as the controlling owner.',
  unverified: 'We found no free primary document that settles who controls it, so we do not say.',
}

export const VERDICTS: Verdict[] = ['eu-controlled', 'non-eu-controlled', 'pe-controlled', 'unverified']

/** Directory products: rows listed on at least one buy-European directory. */
export const DIRECTORY_ROWS = ROWS.filter((r) => r.list !== 'dora-provider')
/** ICT providers that EU financial entities report in the DORA register. */
export const DORA_ROWS = ROWS.filter((r) => r.list !== 'directory')

const LEI_RE = /^[A-Z0-9]{18}[0-9]{2}/

/** The row's own LEI, or null when the field says none, not resolved, etc. */
export function leiCode(r: Pick<Row, 'lei'>): string | null {
  const m = (r.lei || '').match(LEI_RE)
  return m ? m[0] : null
}

export function isCandidateLei(r: Pick<Row, 'lei'>): boolean {
  return /candidate|unconfirmed/i.test(r.lei || '')
}

const EU = new Set('AT BE BG HR CY CZ DK EE FI FR DE GR IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' '))
const EUROPE_NON_EU = new Set('CH GB UK NO IS LI JE GG IM'.split(' '))

export type Region = 'EU' | 'Europe outside the EU' | 'Outside Europe' | 'Unknown'

/** Where the verified owner sits, read from the first country code in
 *  owner_country. Unverified rows are always Unknown: an owner country on an
 *  unverified row is a lead, not a finding. */
export function ownerRegion(r: Row): Region {
  if (r.verdict === 'unverified') return 'Unknown'
  const m = (r.owner_country || '').match(/^\s*([A-Z]{2})\b/)
  if (!m) return 'Unknown'
  if (EU.has(m[1])) return 'EU'
  if (EUROPE_NON_EU.has(m[1])) return 'Europe outside the EU'
  return 'Outside Europe'
}

export type GleifView = 'no-lei' | 'exception' | 'parent' | 'no-data'

export const GLEIF_VIEW_LABEL: Record<GleifView, string> = {
  'no-lei': 'No LEI',
  exception: 'Reports no parent (exception)',
  parent: 'Names a parent',
  'no-data': 'No relationship data',
}

/** What GLEIF shows about the row's parent: nothing (no LEI), a reporting
 *  exception, or a named parent entity with its own LEI. */
export function gleifView(r: Row): GleifView {
  const own = leiCode(r)
  if (!own) return 'no-lei'
  const text = r.gleif_parent || ''
  const others = (text.match(/\b[A-Z0-9]{18}[0-9]{2}\b/g) || []).filter((l) => l !== own)
  const leadsWithException = /^\s*(direct parent: )?(reporting )?exception|^\s*(NO_LEI|NON_CONSOLIDATING|NATURAL_PERSONS|NO_KNOWN_PERSON)/i.test(text)
  if (others.length && !leadsWithException) return 'parent'
  if (others.length && /ultimate[^;]*\b[A-Z0-9]{18}[0-9]{2}\b/.test(text)) return 'parent'
  if (/exception|NO_LEI|NON_CONSOLIDATING|NATURAL_PERSONS|NO_KNOWN_PERSON|NON_PUBLIC/i.test(text)) return 'exception'
  return 'no-data'
}

export function count<T>(items: T[], pred: (t: T) => boolean) {
  return items.reduce((n, t) => (pred(t) ? n + 1 : n), 0)
}

export function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0
}

/** The headline figures for the directory side of the audit. */
export function directoryStats(rows: Row[] = DIRECTORY_ROWS) {
  const verified = rows.filter((r) => r.verdict !== 'unverified')
  const notEu = rows.filter((r) => r.verdict === 'non-eu-controlled')
  const pe = rows.filter((r) => r.verdict === 'pe-controlled')
  const hidden = [...notEu, ...pe]
  return {
    total: rows.length,
    verified: verified.length,
    unverified: rows.length - verified.length,
    eu: count(rows, (r) => r.verdict === 'eu-controlled'),
    nonEu: notEu.length,
    nonEuOutsideEurope: count(notEu, (r) => ownerRegion(r) === 'Outside Europe'),
    nonEuInEurope: count(notEu, (r) => ownerRegion(r) === 'Europe outside the EU'),
    pe: pe.length,
    /** Rows with verified non-EU or PE control … */
    hidden: hidden.length,
    /** … and of those, how many GLEIF names a parent for. */
    hiddenGleifNamesParent: count(hidden, (r) => gleifView(r) === 'parent'),
    noLei: count(rows, (r) => gleifView(r) === 'no-lei'),
    exception: count(rows, (r) => gleifView(r) === 'exception'),
    parentNamed: count(rows, (r) => gleifView(r) === 'parent'),
    lapsed: count(rows, (r) => /LAPSED/i.test(r.lei_status)),
    onAllFive: count(rows, (r) => r.listed_on.length === META.directories.length),
  }
}

export function doraStats(rows: Row[] = DORA_ROWS) {
  return {
    total: rows.length,
    withLei: count(rows, (r) => !!leiCode(r)),
    lapsed: count(rows, (r) => /LAPSED/i.test(r.lei_status)),
    ctpp: count(rows, (r) => !!r.ctpp_rollup && r.ctpp_rollup !== 'none'),
    nonEu: count(rows, (r) => r.verdict === 'non-eu-controlled'),
    /** Of the verified non-EU-controlled providers, how many GLEIF names a
     *  parent for. The contrast with directoryStats().hiddenGleifNamesParent is
     *  the GLEIF-visibility finding: the register sees the global providers
     *  and not Europe's own vendors. */
    nonEuGleifNamesParent: count(rows, (r) => r.verdict === 'non-eu-controlled' && gleifView(r) === 'parent'),
    parentNamed: count(rows, (r) => gleifView(r) === 'parent'),
    unverified: count(rows, (r) => r.verdict === 'unverified'),
  }
}

/** Countries, categories etc. in display order, with counts. */
export function facet(rows: Row[], key: (r: Row) => string) {
  const m = new Map<string, number>()
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

// ---------------------------------------------------------------- answer pages
//
// One static page per company only for the names people actually search for,
// not one per row: thin pages for 216 rows would be the pattern search engines
// demote. The ranking is the Google Suggest score recorded when the universe
// was built (18 Oct 2026), with the names the plan singled out always in.

const ALWAYS = ['spotify', 'mistral-ai', 'hetzner', 'proton', 'ecosia', 'ovhcloud', 'bol-com', 'ionos', 'pipedrive', 'owncloud', 'threema', 'wise']
export const FEATURED_COUNT = 40

export const FEATURED: Row[] = (() => {
  const dir = [...DIRECTORY_ROWS].sort((a, b) => b.search_score - a.search_score || a.product.localeCompare(b.product))
  // One page per name: a product listed both as a directory product and as a
  // DORA provider (Adyen) has two rows but gets one page, the directory row.
  dir.sort((a, b) => Number(a.list !== 'directory') - Number(b.list !== 'directory'))
  dir.sort((a, b) => b.search_score - a.search_score)
  const picked = new Map<string, Row>()
  const names = new Set<string>()
  const add = (r: Row) => {
    const n = shortName(r).toLowerCase()
    if (names.has(n)) return
    names.add(n)
    picked.set(r.slug, r)
  }
  for (const s of ALWAYS) {
    const r = dir.find((x) => x.slug === s)
    if (r) add(r)
  }
  for (const r of dir) {
    if (picked.size >= FEATURED_COUNT) break
    add(r)
  }
  return [...picked.values()]
})()

export const FEATURED_SLUGS = new Set(FEATURED.map((r) => r.slug))

/** The product name as people type it: "Jitsi (meet.jit.si)" -> "Jitsi". */
export function shortName(r: Pick<Row, 'product'>) {
  return r.product.replace(/\s*\(.*?\)\s*/g, ' ').trim()
}

export function rowBySlug(slug: string) {
  return ROWS.find((r) => r.slug === slug)
}

export function badgePath(slug: string) {
  return `${PATH}/badge/${slug}.svg`
}

/** The one-sentence answer used as the title-question's answer. Never stronger
 *  than the verdict. */
export function answer(r: Row): string {
  const name = shortName(r)
  switch (r.verdict) {
    case 'eu-controlled':
      return `Yes. ${name} is controlled from the EU: ${firstClause(r.owner)}.`
    case 'non-eu-controlled':
      if (ownerRegion(r) === 'Europe outside the EU')
        return `European, but not EU. ${name} is controlled from outside the EU (${(r.owner_country.match(/^\s*([A-Z]{2})\b/) || ['', r.owner_country])[1]}): ${firstClause(r.owner)}.`
      if (ownerRegion(r) === 'Outside Europe')
        return `No. ${name} is controlled from outside Europe: ${firstClause(r.owner)}.`
      return `Not EU-controlled. ${name}'s controlling owner is based outside the EU: ${firstClause(r.owner)}.`
    case 'pe-controlled':
      return `${name} is controlled by private equity: ${firstClause(r.owner)}.`
    default:
      return `Not verified. We found no free primary document that settles who controls ${name}, so we do not give a verdict.`
  }
}

/** The owner text up to its first top-level semicolon, so "X (US, 90%; 10%
 *  own shares), owned by Y" is never cut inside the brackets. */
function firstClause(s: string) {
  const text = s || ''
  let depth = 0
  let end = text.length
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (c === ';' && depth === 0) {
      end = i
      break
    }
  }
  const t = text.slice(0, end).trim().replace(/\.$/, '')
  return t.length > 220 ? t.slice(0, 217).replace(/\s+\S*$/, '') + '…' : t
}

/** Trim to a word boundary for meta descriptions. */
export function clip(s: string, n = 155) {
  return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'
}

// --------------------------------------------------------------------- citing

export const CITATION = {
  author: 'Analytics Ascent research desk',
  year: META.version.slice(0, 4),
  title: DATASET_NAME,
  version: META.version,
  url: 'https://analyticascent.com/really-european',
}

export function apaCitation() {
  return `${CITATION.author}. (${CITATION.year}). ${CITATION.title} (Version ${CITATION.version}) [Data set]. Analytics Ascent. ${CITATION.url}`
}

export function bibtexCitation() {
  return `@misc{analyticsascent_really_european_${CITATION.version.replace(/-/g, '')},
  author       = {{Analytics Ascent research desk}},
  title        = {{${CITATION.title}}},
  year         = {${CITATION.year}},
  version      = {${CITATION.version}},
  publisher    = {Analytics Ascent},
  howpublished = {\\url{${CITATION.url}}},
  note         = {Dataset, CC0 1.0. Checked ${META.checked_on}}
}`
}

// ------------------------------------------------------------ DORA providers

/** LEIs named in the row's GLEIF text or notes as LAPSED or RETIRED, other than
 *  the row's own. These are the twins a filer must not copy into B_05.01. */
export function lapsedTwins(r: Row): { lei: string; context: string }[] {
  const own = leiCode(r)
  const out: { lei: string; context: string }[] = []
  const seen = new Set<string>()
  for (const text of [r.gleif_parent, r.notes]) {
    for (const sentence of (text || '').split(/(?<=[.;])\s+/)) {
      if (!/LAPSED|RETIRED|lapsed|retired/.test(sentence)) continue
      for (const lei of sentence.match(/\b[A-Z0-9]{18}[0-9]{2}\b/g) || []) {
        if (lei === own || seen.has(lei)) continue
        seen.add(lei)
        out.push({ lei, context: sentence.length > 240 ? sentence.slice(0, 237) + '…' : sentence })
      }
    }
  }
  return out
}

export function ctppLine(r: Row): string | null {
  return r.ctpp_rollup && r.ctpp_rollup !== 'none' ? r.ctpp_rollup : null
}
