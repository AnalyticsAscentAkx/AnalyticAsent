// The register as three readable tables: providers, functions, contracts.
//
// The templates are normalised for machines — a provider's expense is in
// B_05.01, its criticality is in B_06.01 by way of B_02.02, its exit plan is
// in B_07.01. Nobody can read that. These joins put each thing's facts on one
// row, which is what the report and the on-page tables show.

import { matchCtpp, type CriticalProvider } from './reference'
import { get, idx } from './rules'
import { DOMAINS, memberLabel, V } from './schema'
import type { Register } from './types'

export interface ProviderRow {
  code: string
  codeType: string
  name: string
  country: string
  expense: number | null
  currency: string
  ultimateParent: string
  ultimateParentName: string
  direct: boolean
  contracts: number
  services: number
  criticalServices: number
  serviceTypes: string[]
  /** Worst substitutability reported across the provider's B_07.01 rows. */
  substitutability: string
  exitPlan: 'yes' | 'no' | 'mixed' | ''
  ctpp?: CriticalProvider
}

export interface FunctionRow {
  id: string
  entity: string
  entityName: string
  name: string
  activity: string
  critical: 'yes' | 'no' | 'not assessed' | ''
  assessed: string
  rto: string
  rpo: string
  impact: string
  services: number
  providers: number
}

export interface ContractRow {
  ref: string
  type: string
  overarching: string
  providers: string[]
  entities: string[]
  expense: number | null
  currency: string
  start: string
  end: string
  services: number
  criticalServices: number
  serviceTypes: string[]
}

const code = (v: string) => v.replace(/^eba_[A-Za-z]+:/, '')

export function providerTable(reg: Register): ProviderRow[] {
  const T = reg.tables
  const b0501 = T['B_05.01']
  if (!b0501) return []
  const ix = idx(b0501)
  const names = new Map<string, string>()
  b0501.rows.forEach((r) => names.set(get(r, ix['c0010']), get(r, ix['c0060']) || get(r, ix['c0050'])))

  const direct = new Set<string>()
  const contracts = new Map<string, Set<string>>()
  if (T['B_03.02']) {
    const i2 = idx(T['B_03.02'])
    for (const r of T['B_03.02'].rows) {
      const p = get(r, i2['c0020'])
      direct.add(p)
      if (!contracts.has(p)) contracts.set(p, new Set())
      contracts.get(p)!.add(get(r, i2['c0010']))
    }
  }
  const critical = criticalFunctions(reg)
  const services = new Map<string, { n: number; crit: number; types: Set<string> }>()
  if (T['B_02.02']) {
    const i2 = idx(T['B_02.02'])
    for (const r of T['B_02.02'].rows) {
      const p = get(r, i2['c0030'])
      const s = services.get(p) ?? { n: 0, crit: 0, types: new Set() }
      s.n++
      if (critical.has(`${get(r, i2['c0050'])}|${get(r, i2['c0020'])}`)) s.crit++
      const t = get(r, i2['c0060'])
      if (t) s.types.add(code(t))
      services.set(p, s)
    }
  }
  const SUB_RANK: Record<string, number> = { 'eba_ZZ:x959': 4, 'eba_ZZ:x960': 3, 'eba_ZZ:x961': 2, 'eba_ZZ:x962': 1 }
  const sub = new Map<string, string>()
  const exit = new Map<string, Set<string>>()
  if (T['B_07.01']) {
    const i2 = idx(T['B_07.01'])
    for (const r of T['B_07.01'].rows) {
      const p = get(r, i2['c0020'])
      const s = get(r, i2['c0050'])
      if ((SUB_RANK[s] ?? 0) > (SUB_RANK[sub.get(p) ?? ''] ?? 0)) sub.set(p, s)
      const e = get(r, i2['c0080'])
      if (e) {
        if (!exit.has(p)) exit.set(p, new Set())
        exit.get(p)!.add(e)
      }
    }
  }
  return b0501.rows
    .map((r) => {
      const c = get(r, ix['c0010'])
      const amt = get(r, ix['c0100'])
      const up = get(r, ix['c0110'])
      const s = services.get(c)
      const ex = exit.get(c)
      const type = get(r, ix['c0020'])
      return {
        code: c,
        codeType: memberLabel('qCO6', type).replace('Legal Entity Identfier (LEI)', 'LEI'),
        name: names.get(c) ?? c,
        country: code(get(r, ix['c0080'])),
        expense: amt !== '' && !Number.isNaN(Number(amt)) ? Number(amt) : null,
        currency: code(get(r, ix['c0090'])),
        ultimateParent: up,
        ultimateParentName: up === c ? '' : (names.get(up) ?? up),
        direct: direct.has(c),
        contracts: contracts.get(c)?.size ?? 0,
        services: s?.n ?? 0,
        criticalServices: s?.crit ?? 0,
        serviceTypes: [...(s?.types ?? [])].sort(),
        substitutability: sub.has(c) ? memberLabel('ZZ4_3', sub.get(c)!) : '',
        exitPlan: !ex || ex.size === 0 ? '' : ex.size > 1 ? 'mixed' : ex.has(V.YES) ? 'yes' : 'no',
        ctpp: matchCtpp(type === V.LEI ? c : undefined, names.get(c)),
      } as ProviderRow
    })
    .sort((a, b) => (b.expense ?? -1) - (a.expense ?? -1) || b.criticalServices - a.criticalServices)
}

export function criticalFunctions(reg: Register): Set<string> {
  const out = new Set<string>()
  const t = reg.tables['B_06.01']
  if (!t) return out
  const ix = idx(t)
  for (const r of t.rows) if (get(r, ix['c0050']) === V.YES) out.add(`${get(r, ix['c0010'])}|${get(r, ix['c0040'])}`)
  return out
}

export function functionTable(reg: Register): FunctionRow[] {
  const T = reg.tables
  const b0601 = T['B_06.01']
  if (!b0601) return []
  const ix = idx(b0601)
  const entityNames = new Map<string, string>()
  if (T['B_01.02']) {
    const i2 = idx(T['B_01.02'])
    for (const r of T['B_01.02'].rows) entityNames.set(get(r, i2['c0010']), get(r, i2['c0020']))
  }
  const use = new Map<string, { n: number; providers: Set<string> }>()
  if (T['B_02.02']) {
    const i2 = idx(T['B_02.02'])
    for (const r of T['B_02.02'].rows) {
      const k = `${get(r, i2['c0050'])}|${get(r, i2['c0020'])}`
      const u = use.get(k) ?? { n: 0, providers: new Set() }
      u.n++
      u.providers.add(get(r, i2['c0030']))
      use.set(k, u)
    }
  }
  const CRIT: Record<string, FunctionRow['critical']> = { [V.YES]: 'yes', [V.NO]: 'no', [V.NOT_ASSESSED]: 'not assessed' }
  return b0601.rows.map((r) => {
    const id = get(r, ix['c0010'])
    const ent = get(r, ix['c0040'])
    const u = use.get(`${id}|${ent}`)
    return {
      id,
      entity: ent,
      entityName: entityNames.get(ent) ?? ent,
      name: get(r, ix['c0030']),
      activity: memberLabel('TA131', get(r, ix['c0020'])),
      critical: CRIT[get(r, ix['c0050'])] ?? '',
      assessed: get(r, ix['c0070']),
      rto: get(r, ix['c0080']),
      rpo: get(r, ix['c0090']),
      impact: memberLabel('ZZ4_2', get(r, ix['c0100'])),
      services: u?.n ?? 0,
      providers: u?.providers.size ?? 0,
    }
  })
}

export function contractTable(reg: Register): ContractRow[] {
  const T = reg.tables
  const b0201 = T['B_02.01']
  if (!b0201) return []
  const ix = idx(b0201)
  const provNames = new Map<string, string>()
  if (T['B_05.01']) {
    const i2 = idx(T['B_05.01'])
    for (const r of T['B_05.01'].rows) provNames.set(get(r, i2['c0010']), get(r, i2['c0060']) || get(r, i2['c0050']))
  }
  const entityNames = new Map<string, string>()
  if (T['B_01.02']) {
    const i2 = idx(T['B_01.02'])
    for (const r of T['B_01.02'].rows) entityNames.set(get(r, i2['c0010']), get(r, i2['c0020']))
  }
  const critical = criticalFunctions(reg)
  const agg = new Map<string, { providers: Set<string>; entities: Set<string>; n: number; crit: number; types: Set<string>; start: string; end: string }>()
  if (T['B_02.02']) {
    const i2 = idx(T['B_02.02'])
    for (const r of T['B_02.02'].rows) {
      const c = get(r, i2['c0010'])
      const a = agg.get(c) ?? { providers: new Set(), entities: new Set(), n: 0, crit: 0, types: new Set(), start: '', end: '' }
      a.providers.add(provNames.get(get(r, i2['c0030'])) ?? get(r, i2['c0030']))
      a.entities.add(entityNames.get(get(r, i2['c0020'])) ?? get(r, i2['c0020']))
      a.n++
      if (critical.has(`${get(r, i2['c0050'])}|${get(r, i2['c0020'])}`)) a.crit++
      const t = get(r, i2['c0060'])
      if (t) a.types.add(code(t))
      const s = get(r, i2['c0070'])
      const e = get(r, i2['c0080'])
      if (s && (!a.start || s < a.start)) a.start = s
      if (e && (!a.end || e > a.end)) a.end = e
      agg.set(c, a)
    }
  }
  return b0201.rows.map((r) => {
    const ref = get(r, ix['c0010'])
    const a = agg.get(ref)
    const amt = get(r, ix['c0050'])
    return {
      ref,
      type: memberLabel('CO3', get(r, ix['c0020'])),
      overarching: get(r, ix['c0030']),
      providers: [...(a?.providers ?? [])],
      entities: [...(a?.entities ?? [])],
      expense: amt !== '' && !Number.isNaN(Number(amt)) ? Number(amt) : null,
      currency: code(get(r, ix['c0040'])),
      start: a?.start ?? '',
      end: a?.end ?? '',
      services: a?.n ?? 0,
      criticalServices: a?.crit ?? 0,
      serviceTypes: [...(a?.types ?? [])].sort(),
    }
  })
}

/** Service rows by ICT service type, with the critical share. */
export function serviceMix(reg: Register): { code: string; label: string; rows: number; critical: number }[] {
  const t = reg.tables['B_02.02']
  if (!t) return []
  const ix = idx(t)
  const critical = criticalFunctions(reg)
  const m = new Map<string, { rows: number; critical: number }>()
  for (const r of t.rows) {
    const s = get(r, ix['c0060'])
    if (!s) continue
    const e = m.get(s) ?? { rows: 0, critical: 0 }
    e.rows++
    if (critical.has(`${get(r, ix['c0050'])}|${get(r, ix['c0020'])}`)) e.critical++
    m.set(s, e)
  }
  const TA = DOMAINS['TA19'] ?? {}
  return [...m.entries()]
    .map(([c, v]) => ({ code: code(c), label: TA[c] ?? code(c), ...v }))
    .sort((a, b) => b.rows - a.rows)
}
