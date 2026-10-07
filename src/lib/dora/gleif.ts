// LEI checks against GLEIF, from the browser.
//
// This is the one step that leaves the tab, and it sends identifiers only:
// the LEIs found in the register, in batches of 200, to api.gleif.org. GLEIF
// publishes the data under CC0 and sends CORS headers, so no proxy is needed
// and nothing passes through this site. The visitor chooses to run it.
//
// What comes back per LEI: whether the record exists, its registration status
// (ISSUED, LAPSED, RETIRED …), the legal name, the legal-address country and
// the ultimate parent on file. That is enough to run the EBA's VR_2/12/16/23/71/77
// checks locally and to compare what the register declares about group
// structure with what the providers themselves have filed.

import { get, idx, LEI_COLS } from './rules'
import { V } from './schema'
import type { Finding, Register } from './types'

export interface LeiRecord {
  lei: string
  found: boolean
  status?: string
  entityStatus?: string
  name?: string
  country?: string
  ultimateParent?: string
  directParent?: string
  /** Reason code when the entity reports no parent (e.g. NO_KNOWN_PERSON, NON_CONSOLIDATING). */
  parentException?: string
}

const API = 'https://api.gleif.org/api/v1/lei-records'
const BATCH = 200

/** Every distinct, well-formed LEI in the register. */
export function collectLeis(reg: Register): string[] {
  const set = new Set<string>()
  for (const [code, col, typeCol] of LEI_COLS) {
    const data = reg.tables[code]
    if (!data) continue
    const ix = idx(data)
    const i = ix[col]
    if (i === undefined) continue
    for (const row of data.rows) {
      const v = get(row, i)
      if (!/^[A-Z0-9]{18}[0-9]{2}$/.test(v)) continue
      if (typeCol && get(row, ix[typeCol]) !== V.LEI) continue
      set.add(v)
    }
  }
  return [...set]
}

export async function lookupLeis(
  leis: string[],
  onProgress?: (done: number, total: number) => void,
  fetcher: typeof fetch = fetch,
): Promise<Map<string, LeiRecord>> {
  const out = new Map<string, LeiRecord>()
  for (let i = 0; i < leis.length; i += BATCH) {
    const chunk = leis.slice(i, i + BATCH)
    const url = `${API}?filter[lei]=${chunk.join(',')}&page[size]=${BATCH}&include=ultimate-parent,direct-parent`
    const res = await fetcher(url, { headers: { Accept: 'application/vnd.api+json' } })
    if (res.status === 429) throw new Error('GLEIF is rate-limiting (60 requests a minute). Wait a minute and run the check again.')
    if (!res.ok) throw new Error(`GLEIF answered ${res.status}.`)
    const j = (await res.json()) as GleifResponse
    for (const d of j.data ?? []) {
      const a = d.attributes
      const rel = d.relationships ?? {}
      out.set(d.id, {
        lei: d.id,
        found: true,
        status: a?.registration?.status,
        entityStatus: a?.entity?.status,
        name: a?.entity?.legalName?.name,
        country: a?.entity?.legalAddress?.country,
        // When the entity reports no parent, `data` points at a reporting
        // exception rather than an LEI record; only a lei-records link is a parent.
        ultimateParent: rel['ultimate-parent']?.data?.type === 'lei-records' ? rel['ultimate-parent']?.data?.id : undefined,
        directParent: rel['direct-parent']?.data?.type === 'lei-records' ? rel['direct-parent']?.data?.id : undefined,
        parentException: exceptionReason(rel['ultimate-parent']?.links?.['reporting-exception'], j.included, d.id),
      })
    }
    // Parents come back in `included`; keep them so the findings can name them.
    for (const inc of j.included ?? []) {
      if (inc.type !== 'lei-records' || out.has(inc.id)) continue
      const a = inc.attributes
      if (!a?.entity) continue
      out.set(inc.id, {
        lei: inc.id,
        found: true,
        status: a.registration?.status,
        entityStatus: a.entity.status,
        name: a.entity.legalName?.name,
        country: a.entity.legalAddress?.country,
      })
    }
    for (const l of chunk) if (!out.has(l)) out.set(l, { lei: l, found: false })
    onProgress?.(Math.min(i + BATCH, leis.length), leis.length)
  }
  return out
}

function exceptionReason(link: string | undefined, included: GleifIncluded[] | undefined, lei: string): string | undefined {
  if (!link || !included) return undefined
  const hit = included.find((x) => x.type === 'reporting-exceptions' && x.id.startsWith(`${lei}|`))
  return hit?.attributes?.reason ?? (hit ? hit.id.split('|')[3] : undefined)
}

interface GleifResponse {
  data?: {
    id: string
    attributes?: {
      registration?: { status?: string }
      entity?: { status?: string; legalName?: { name?: string }; legalAddress?: { country?: string } }
    }
    relationships?: Record<string, { data?: { id?: string; type?: string }; links?: Record<string, string> }>
  }[]
  included?: GleifIncluded[]
}
interface GleifIncluded {
  type: string
  id: string
  attributes?: {
    reason?: string
    registration?: { status?: string }
    entity?: { status?: string; legalName?: { name?: string }; legalAddress?: { country?: string } }
  }
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(limited|ltd|plc|inc|corp|corporation|llc|gmbh|ag|se|sa|s\.a\.|nv|n\.v\.|bv|b\.v\.|sarl|s\.a\.r\.l\.|oy|ab|as|spa|s\.p\.a\.|the)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Loose name agreement: all tokens of the shorter name appear in the longer. */
function namesAgree(a: string, b: string): boolean {
  const ta = norm(a).split(' ').filter(Boolean)
  const tb = norm(b).split(' ').filter(Boolean)
  if (ta.length === 0 || tb.length === 0) return true
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  const hits = short.filter((t) => long.includes(t)).length
  return hits >= Math.max(1, Math.ceil(short.length * 0.6))
}

/** The EBA's LEI checks plus what the parent data makes possible. */
export function gleifFindings(reg: Register, records: Map<string, LeiRecord>): Finding[] {
  const out: Finding[] = []
  const f = (rule: string, severity: Finding['severity'], template: string, message: string, extra: Partial<Finding> = {}) =>
    out.push({ rule, layer: 'identifiers', severity, template, message, ...extra })

  const rec = (lei: string) => records.get(lei)
  const cc = (v: string) => v.replace(/^eba_GA:/, '')

  const vr: Record<string, Record<string, string>> = {
    'B_01.01': { c0010: 'VR_2' },
    'B_01.02': { c0010: 'VR_12', c0060: 'VR_23' },
    'B_05.01': { c0010: 'VR_71', c0030: 'VR_77' },
  }
  // Existence and status, in the columns the EBA checks. Every other LEI
  // column is tied to one of these by a foreign key, so flagging it again
  // there would repeat the same fact once per referencing table.
  for (const [code, col, typeCol] of LEI_COLS) {
    const rule = vr[code]?.[col]
    if (!rule) continue
    const data = reg.tables[code]
    if (!data) continue
    const ix = idx(data)
    const i = ix[col]
    if (i === undefined) continue
    data.rows.forEach((row, r) => {
      const v = get(row, i)
      if (!/^[A-Z0-9]{18}[0-9]{2}$/.test(v)) return
      if (typeCol && get(row, ix[typeCol]) !== V.LEI) return
      const g = rec(v)
      if (!g) return
      if (!g.found) {
        f(rule, 'warning', code, `${v} is not in the Global LEI Index. The EBA flags this as a data-quality issue; the register may still be accepted.`, { row: r + 1, column: col, value: v })
        return
      }
      if (g.status && g.status !== 'ISSUED') {
        f('AA-21', g.status === 'LAPSED' ? 'insight' : 'warning', code, `${v} is ${g.status.toLowerCase()} in GLEIF${g.name ? ` (${g.name})` : ''}. ${g.status === 'LAPSED' ? 'The ESAs said they would not enforce renewal status in 2025; a lapsed code still identifies the entity.' : g.status === 'RETIRED' ? 'The entity has ceased to exist or merged; this is unlikely to be the counterparty on a live contract.' : ''}`.trim(), { row: r + 1, column: col, value: v })
      }
    })
  }
  // Names and countries against what the register says.
  const b0102 = reg.tables['B_01.02']
  if (b0102) {
    const ix = idx(b0102)
    b0102.rows.forEach((row, r) => {
      const g = rec(get(row, ix['c0010']))
      if (!g?.found) return
      const country = cc(get(row, ix['c0030']))
      if (g.country && country && g.country !== country) {
        f('VR_16', 'warning', 'B_01.02', `Country ${country} does not match the legal address country in GLEIF (${g.country}).`, { row: r + 1, column: 'c0030', value: country })
      }
      const name = get(row, ix['c0020'])
      if (g.name && name && !namesAgree(name, g.name)) {
        f('AA-22', 'insight', 'B_01.02', `The name reported ("${name}") does not resemble the legal name GLEIF holds for this LEI ("${g.name}").`, { row: r + 1, column: 'c0020', value: name })
      }
      const parent = get(row, ix['c0060'])
      if (parent && parent !== get(row, ix['c0010']) && g.directParent && g.directParent !== parent) {
        f('AA-23', 'insight', 'B_01.02', `The direct parent reported (${parent}) differs from the direct parent this entity has filed with GLEIF (${g.directParent}).`, { row: r + 1, column: 'c0060', value: parent })
      }
    })
  }
  const b0501 = reg.tables['B_05.01']
  if (b0501) {
    const ix = idx(b0501)
    b0501.rows.forEach((row, r) => {
      if (get(row, ix['c0020']) !== V.LEI) return
      const code = get(row, ix['c0010'])
      const g = rec(code)
      if (!g?.found) return
      const hq = cc(get(row, ix['c0080']))
      if (g.country && hq && g.country !== hq) {
        f('AA-24', 'insight', 'B_05.01', `Headquarters country ${hq} differs from the legal address country GLEIF holds (${g.country}). Legal seat and headquarters can differ; check which one the ITS wants (headquarters).`, { row: r + 1, column: 'c0080', value: hq })
      }
      const legal = get(row, ix['c0050'])
      const latin = get(row, ix['c0060'])
      if (g.name && (legal || latin) && !namesAgree(latin || legal, g.name) && !namesAgree(legal || latin, g.name)) {
        f('AA-22', 'insight', 'B_05.01', `The provider name ("${latin || legal}") does not resemble the legal name GLEIF holds for ${code} ("${g.name}"). Wrong LEI, or a trading name where the legal name belongs?`, { row: r + 1, column: 'c0050', value: latin || legal })
      }
      const up = get(row, ix['c0110'])
      const upType = get(row, ix['c0120'])
      if (g.ultimateParent) {
        if (up === code) {
          f('AA-25', 'insight', 'B_05.01', `Reported as its own ultimate parent, but GLEIF holds an ultimate parent for it: ${g.ultimateParent}${rec(g.ultimateParent)?.name ? ` (${rec(g.ultimateParent)!.name})` : ''}.`, { row: r + 1, column: 'c0110', value: up })
        } else if (upType === V.LEI && up && up !== g.ultimateParent) {
          f('AA-26', 'insight', 'B_05.01', `The ultimate parent reported (${up}) is not the one on file with GLEIF (${g.ultimateParent}${rec(g.ultimateParent)?.name ? `, ${rec(g.ultimateParent)!.name}` : ''}). Intermediate parent, or an outdated record on one side.`, { row: r + 1, column: 'c0110', value: up })
        }
      } else if (g.parentException && up && up !== code && upType === V.LEI) {
        f('AA-27', 'insight', 'B_05.01', `An ultimate parent is reported (${up}) but the provider itself tells GLEIF it has none (${g.parentException.replace(/_/g, ' ').toLowerCase()}). Not necessarily wrong: non-consolidating parents are not reported to GLEIF.`, { row: r + 1, column: 'c0110', value: up })
      }
    })
  }
  return out
}
