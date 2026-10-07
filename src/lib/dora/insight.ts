// What the register says about the entity, once it parses.
//
// The validation layers answer "will this be accepted". This answers the
// question the register exists to answer — where is the concentration — using
// the same rows, joined the way the templates intend: contracts to providers
// through B_03.02, services to functions through B_06.01, providers to
// parents through B_05.01's own ultimate-parent column. Nothing here is
// asserted that the rows do not support; a register with no expense figures
// gets no expense chart.

import { classifyLocation, matchCtpp, type CriticalProvider, type LocationClass } from './reference'
import { get, idx } from './rules'
import { DOMAINS, V } from './schema'
import type { Register } from './types'

export interface ProviderShare {
  code: string
  name: string
  /** Sum of B_05.01 c0100 for the provider (or its parent group). */
  expense: number
  share: number
  /** Number of B_02.02 rows supporting critical or important functions. */
  criticalServices: number
  cloud: boolean
  /** The provider (or the group it rolls up to) is itself an entity in B_01.02. */
  intraGroup: boolean
  ctpp?: CriticalProvider
}

export interface LocationShare {
  code: string
  label: string
  cls: LocationClass
  /** B_02.02 rows with data at rest here. */
  rows: number
  criticalRows: number
}

export interface Insight {
  entities: number
  branches: number
  contracts: number
  providers: number
  directProviders: number
  functions: number
  criticalFunctions: number
  serviceRows: number
  criticalServiceRows: number
  cloudCriticalRows: number
  /** Share of critical service rows that are cloud (S17–S19). */
  cloudShareOfCritical: number
  providersWithoutLei: number
  placeholderCodes: number
  currency: string
  totalExpense: number
  byProvider: ProviderShare[]
  byGroup: ProviderShare[]
  /** Herfindahl index of expense by ultimate-parent group, 0–1. */
  hhiGroup: number
  topGroupShareOfCritical: number
  ctpps: { provider: CriticalProvider; codes: string[]; criticalServices: number }[]
  locations: LocationShare[]
  thirdCountryCriticalRows: number
  notSubstitutable: number
  noExitPlan: number
  assessments: number
}

export function analyse(reg: Register): Insight {
  const T = reg.tables
  const b0102 = T['B_01.02']
  const b0103 = T['B_01.03']
  const b0201 = T['B_02.01']
  const b0202 = T['B_02.02']
  const b0302 = T['B_03.02']
  const b0501 = T['B_05.01']
  const b0601 = T['B_06.01']
  const b0701 = T['B_07.01']

  const entityLeis = new Set<string>()
  if (b0102) {
    const ix = idx(b0102)
    for (const row of b0102.rows) entityLeis.add(get(row, ix['c0010']))
  }

  // Critical functions.
  const critical = new Set<string>()
  let functions = 0
  if (b0601) {
    const ix = idx(b0601)
    for (const row of b0601.rows) {
      functions++
      if (get(row, ix['c0050']) === V.YES) critical.add(`${get(row, ix['c0010'])}|${get(row, ix['c0040'])}`)
    }
  }

  // Providers.
  interface P { code: string; name: string; type: string; expense: number; currency: string; parent: string; country: string }
  const providers = new Map<string, P>()
  let providersWithoutLei = 0
  let placeholderCodes = 0
  if (b0501) {
    const ix = idx(b0501)
    for (const row of b0501.rows) {
      const code = get(row, ix['c0010'])
      if (!code) continue
      const type = get(row, ix['c0020'])
      if (type && type !== V.LEI) providersWithoutLei++
      if (/DUMMY|^9{7}|^0{7}|^(.)\1{7,}$/i.test(code)) placeholderCodes++
      const amt = Number(get(row, ix['c0100']).replace(/,/g, ''))
      providers.set(code, {
        code,
        name: get(row, ix['c0060']) || get(row, ix['c0050']) || code,
        type,
        expense: Number.isFinite(amt) ? amt : 0,
        currency: get(row, ix['c0090']).replace(/^eba_CU:/, ''),
        parent: get(row, ix['c0110']) || code,
        country: get(row, ix['c0080']).replace(/^eba_GA:/, ''),
      })
    }
  }
  const direct = new Set<string>()
  if (b0302) {
    const ix = idx(b0302)
    for (const row of b0302.rows) direct.add(get(row, ix['c0020']))
  }

  // Services.
  const critByProvider = new Map<string, number>()
  const cloudByProvider = new Map<string, boolean>()
  const loc = new Map<string, { rows: number; critical: number }>()
  let serviceRows = 0
  let criticalServiceRows = 0
  let cloudCriticalRows = 0
  let thirdCountryCriticalRows = 0
  if (b0202) {
    const ix = idx(b0202)
    for (const row of b0202.rows) {
      serviceRows++
      const prov = get(row, ix['c0030'])
      const svc = get(row, ix['c0060'])
      const isCloud = V.CLOUD.has(svc)
      if (isCloud) cloudByProvider.set(prov, true)
      const isCrit = critical.has(`${get(row, ix['c0050'])}|${get(row, ix['c0020'])}`)
      const at = get(row, ix['c0150'])
      if (at) {
        const l = loc.get(at) ?? { rows: 0, critical: 0 }
        l.rows++
        if (isCrit) l.critical++
        loc.set(at, l)
      }
      if (isCrit) {
        criticalServiceRows++
        critByProvider.set(prov, (critByProvider.get(prov) ?? 0) + 1)
        if (isCloud) cloudCriticalRows++
        if (at && classifyLocation(at) === 'third-country') thirdCountryCriticalRows++
      }
    }
  }

  // Expense shares, by provider and by ultimate-parent group.
  const currencies = new Map<string, number>()
  for (const p of providers.values()) if (p.currency) currencies.set(p.currency, (currencies.get(p.currency) ?? 0) + 1)
  const currency = [...currencies.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'EUR'
  const totalExpense = [...providers.values()].reduce((s, p) => s + (direct.has(p.code) || direct.size === 0 ? p.expense : 0), 0)

  // Roll up to the ultimate parent: follow c0110 until it stops changing.
  const root = (code: string): string => {
    let cur = code
    for (let i = 0; i < 10; i++) {
      const p = providers.get(cur)
      if (!p || p.parent === cur || !providers.has(p.parent)) return cur
      cur = p.parent
    }
    return cur
  }

  const share = (p: P): ProviderShare => ({
    code: p.code,
    name: p.name,
    expense: p.expense,
    share: totalExpense > 0 ? p.expense / totalExpense : 0,
    criticalServices: critByProvider.get(p.code) ?? 0,
    cloud: cloudByProvider.get(p.code) ?? false,
    intraGroup: entityLeis.has(p.code) || entityLeis.has(root(p.code)),
    ctpp: matchCtpp(p.type === V.LEI ? p.code : undefined, p.name),
  })
  const byProvider = [...providers.values()]
    .filter((p) => direct.has(p.code) || direct.size === 0)
    .map(share)
    .sort((a, b) => b.expense - a.expense || b.criticalServices - a.criticalServices)

  const groups = new Map<string, ProviderShare>()
  for (const p of providers.values()) {
    if (!(direct.has(p.code) || direct.size === 0)) continue
    const r = root(p.code)
    const rp = providers.get(r) ?? p
    const g = groups.get(r) ?? { code: r, name: rp.name, expense: 0, share: 0, criticalServices: 0, cloud: false, intraGroup: entityLeis.has(r), ctpp: matchCtpp(rp.type === V.LEI ? r : undefined, rp.name, p.name) }
    g.expense += p.expense
    g.criticalServices += critByProvider.get(p.code) ?? 0
    g.cloud = g.cloud || (cloudByProvider.get(p.code) ?? false)
    if (!g.ctpp) g.ctpp = matchCtpp(p.type === V.LEI ? p.code : undefined, p.name)
    groups.set(r, g)
  }
  const byGroup = [...groups.values()]
    .map((g) => ({ ...g, share: totalExpense > 0 ? g.expense / totalExpense : 0 }))
    .sort((a, b) => b.expense - a.expense || b.criticalServices - a.criticalServices)
  const hhiGroup = byGroup.reduce((s, g) => s + g.share * g.share, 0)
  const topGroupShareOfCritical = criticalServiceRows > 0 ? Math.max(0, ...byGroup.map((g) => g.criticalServices)) / criticalServiceRows : 0

  // Critical providers present.
  const ctppMap = new Map<string, { provider: CriticalProvider; codes: string[]; criticalServices: number }>()
  for (const p of providers.values()) {
    const c = matchCtpp(p.type === V.LEI ? p.code : undefined, p.name)
    if (!c) continue
    const e = ctppMap.get(c.name) ?? { provider: c, codes: [], criticalServices: 0 }
    e.codes.push(p.code)
    e.criticalServices += critByProvider.get(p.code) ?? 0
    ctppMap.set(c.name, e)
  }

  const GA = DOMAINS['GA252'] ?? {}
  const locations: LocationShare[] = [...loc.entries()]
    .map(([code, v]) => ({ code, label: GA[code] ?? code.replace(/^eba_GA:/, ''), cls: classifyLocation(code), rows: v.rows, criticalRows: v.critical }))
    .sort((a, b) => b.criticalRows - a.criticalRows || b.rows - a.rows)

  let notSubstitutable = 0
  let noExitPlan = 0
  let assessments = 0
  if (b0701) {
    const ix = idx(b0701)
    for (const row of b0701.rows) {
      assessments++
      const s = get(row, ix['c0050'])
      if (s === V.NOT_SUBSTITUTABLE || s === V.HIGHLY_COMPLEX_SUBSTITUTABILITY) notSubstitutable++
      if (get(row, ix['c0080']) === V.NO) noExitPlan++
    }
  }

  return {
    entities: b0102?.rows.length ?? 0,
    branches: b0103?.rows.length ?? 0,
    contracts: b0201?.rows.length ?? 0,
    providers: providers.size,
    directProviders: direct.size,
    functions,
    criticalFunctions: critical.size,
    serviceRows,
    criticalServiceRows,
    cloudCriticalRows,
    cloudShareOfCritical: criticalServiceRows > 0 ? cloudCriticalRows / criticalServiceRows : 0,
    providersWithoutLei,
    placeholderCodes,
    currency,
    totalExpense,
    byProvider,
    byGroup,
    hhiGroup,
    topGroupShareOfCritical,
    ctpps: [...ctppMap.values()].sort((a, b) => b.criticalServices - a.criticalServices),
    locations,
    thirdCountryCriticalRows,
    notSubstitutable,
    noExitPlan,
    assessments,
  }
}
