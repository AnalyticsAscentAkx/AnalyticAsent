// CM Optimiser — the matching engine.
//
// A direct port of tools/cm-optimiser/engine.py. The Python side is where the
// weights are tuned and the benchmark is measured; this side only applies the
// result. If the two ever disagree the published numbers are wrong, so the
// feature definitions below must stay in lockstep with build_features().

import { AlloyTable, stockVolumeCm3 } from './catalogue'
import type {
  AlloyGrade,
  Difference,
  Match,
  MatchBand,
  MatchResult,
  Model,
  Part,
  PriceAnchor,
} from './types'

const LOG_FLOOR = 1e-9
const log10 = (x: number) => Math.log10(Math.max(x, LOG_FLOOR))

export const NUMERIC_FEATURES = [
  'log_part_mass',
  'log_dim_1',
  'log_dim_2',
  'log_dim_3',
  'log_tol',
  'n_features',
  'n_setups',
  'surface_Ra_um',
  'log_batch_qty',
] as const

export const CATEGORICAL_FEATURES = ['part_family', 'surface_treat', 'process'] as const

export type NumericFeature = (typeof NUMERIC_FEATURES)[number]
export type CategoricalFeature = (typeof CATEGORICAL_FEATURES)[number]

/** Envelope dimensions, largest first. Sorting is what makes the comparison
 *  orientation-invariant: a 100×50×20 part and a 20×100×50 part are one part. */
export function sortedDims(p: Pick<Part, 'envL' | 'envW' | 'envH'>): [number, number, number] {
  const d = [p.envL, p.envW, p.envH].sort((a, b) => b - a)
  return [d[0], d[1], d[2]]
}

export function numericFeature(p: Part, f: NumericFeature): number {
  const d = sortedDims(p)
  switch (f) {
    case 'log_part_mass':
      return log10(p.partMassKg)
    case 'log_dim_1':
      return log10(d[0])
    case 'log_dim_2':
      return log10(d[1])
    case 'log_dim_3':
      return log10(d[2])
    case 'log_tol':
      return log10(p.tightestTolMm)
    case 'n_features':
      return p.nFeatures
    case 'n_setups':
      return p.nSetups
    case 'surface_Ra_um':
      return p.surfaceRaUm
    case 'log_batch_qty':
      return log10(p.batchQty)
  }
}

export function categoricalFeature(p: Part, f: CategoricalFeature): string {
  switch (f) {
    case 'part_family':
      return p.partFamily
    case 'surface_treat':
      return p.surfaceTreat
    case 'process':
      return p.process
  }
}

/** Precomputed feature rows, so a query does not recompute the catalogue. */
export interface FeatureMatrix {
  numeric: Float32Array
  categorical: string[][]
}

export function buildMatrix(parts: Part[]): FeatureMatrix {
  const nf = NUMERIC_FEATURES.length
  const numeric = new Float32Array(parts.length * nf)
  const categorical: string[][] = CATEGORICAL_FEATURES.map(() => new Array(parts.length))
  for (let i = 0; i < parts.length; i++) {
    for (let j = 0; j < nf; j++) numeric[i * nf + j] = numericFeature(parts[i], NUMERIC_FEATURES[j])
    for (let j = 0; j < CATEGORICAL_FEATURES.length; j++) {
      categorical[j][i] = categoricalFeature(parts[i], CATEGORICAL_FEATURES[j])
    }
  }
  return { numeric, categorical }
}

// ---------------------------------------------------------------- distance ---

export interface QueryOptions {
  k?: number
  mode?: 'raw' | 'enriched'
  /** Features this particular query actually has. A row whose dimensions arrived
   *  as "Ø40 x 120" has none unless something parsed them, and the distance is
   *  renormalised over what remains rather than treating absence as agreement. */
  available?: Set<string>
  toYear?: number
}

/** Weighted Gower distance in [0, 1]. */
function distanceTo(
  qNum: Float32Array,
  qCat: string[],
  m: FeatureMatrix,
  i: number,
  model: Model,
  avail: Set<string> | undefined,
): number {
  const nf = NUMERIC_FEATURES.length
  let total = 0
  let wsum = 0
  for (let j = 0; j < nf; j++) {
    const f = NUMERIC_FEATURES[j]
    if (avail && !avail.has(f)) continue
    const w = model.weights[f] ?? 0
    if (w <= 0) continue
    const range = model.ranges[f] || 1
    const d = Math.min(Math.abs(m.numeric[i * nf + j] - qNum[j]) / range, 1)
    total += w * d
    wsum += w
  }
  for (let j = 0; j < CATEGORICAL_FEATURES.length; j++) {
    const f = CATEGORICAL_FEATURES[j]
    if (avail && !avail.has(f)) continue
    const w = model.weights[f] ?? 0
    if (w <= 0) continue
    total += w * (m.categorical[j][i] === qCat[j] ? 0 : 1)
    wsum += w
  }
  return wsum > 0 ? total / wsum : 1
}

export function bandFor(distance: number, model: Model): MatchBand {
  if (distance < model.bands.high) return 'HIGH'
  if (distance < model.bands.medium) return 'MEDIUM'
  return 'LOW'
}

// ------------------------------------------------------------ price anchor ---

export function adjustPrice(
  price: number,
  fromQty: number,
  toQty: number,
  fromYear: number,
  toYear: number,
  slope: number,
  drift: number,
): number {
  const q = Math.pow(Math.max(toQty, 1) / Math.max(fromQty, 1), slope)
  const d = Math.pow(1 + drift, toYear - fromYear)
  return price * q * d
}

/** Inverse-distance weighted median of the neighbours' adjusted prices, with a
 *  10th–90th percentile range. A median, not a mean: one freak quote in five
 *  years of history should not be allowed to move the anchor. */
export function priceAnchor(rows: { adjustedPriceEur: number; distance: number }[]): PriceAnchor | null {
  if (rows.length === 0) return null
  const sorted = [...rows].sort((a, b) => a.adjustedPriceEur - b.adjustedPriceEur)
  const w = sorted.map((r) => 1 / (r.distance + 0.02))
  const total = w.reduce((a, b) => a + b, 0)
  const at = (p: number) => {
    let acc = 0
    for (let i = 0; i < sorted.length; i++) {
      acc += w[i] / total
      if (acc >= p) return sorted[i].adjustedPriceEur
    }
    return sorted[sorted.length - 1].adjustedPriceEur
  }
  return { point: at(0.5), low: at(0.1), high: at(0.9) }
}

// --------------------------------------------------------------- explaining ---

const LABELS: Record<string, string> = {
  log_part_mass: 'part mass',
  log_dim_1: 'largest dimension',
  log_dim_2: 'middle dimension',
  log_dim_3: 'smallest dimension',
  log_tol: 'tightest tolerance',
  n_features: 'feature count',
  n_setups: 'setups',
  surface_Ra_um: 'surface finish',
  log_batch_qty: 'batch quantity',
  part_family: 'part family',
  surface_treat: 'surface treatment',
  process: 'process',
}

function pct(a: number, b: number) {
  if (b === 0) return null
  const r = (a - b) / b
  const s = Math.abs(r) < 0.005 ? 'the same' : `${Math.abs(Math.round(r * 100))}% ${r > 0 ? 'more' : 'less'}`
  return s
}

function describe(f: string, q: Part, c: Part): string {
  const qd = sortedDims(q)
  const cd = sortedDims(c)
  const mm = (x: number) => `${x.toFixed(0)} mm`
  switch (f) {
    case 'log_part_mass': {
      const r = pct(q.partMassKg, c.partMassKg)
      return r === 'the same'
        ? `same mass, ${q.partMassKg.toFixed(2)} kg`
        : `${r === null ? '' : r} metal — ${q.partMassKg.toFixed(2)} kg vs ${c.partMassKg.toFixed(2)} kg`
    }
    case 'log_dim_1':
      return `${mm(qd[0])} long vs ${mm(cd[0])}`
    case 'log_dim_2':
      return `${mm(qd[1])} across vs ${mm(cd[1])}`
    case 'log_dim_3':
      return `${mm(qd[2])} thick vs ${mm(cd[2])}`
    case 'log_tol':
      return `tolerance ${q.tightestTolMm} vs ${c.tightestTolMm} mm`
    case 'n_features':
      return `${q.nFeatures} features vs ${c.nFeatures}`
    case 'n_setups':
      return `${q.nSetups} setup${q.nSetups === 1 ? '' : 's'} vs ${c.nSetups}`
    case 'surface_Ra_um':
      return `Ra ${q.surfaceRaUm} vs ${c.surfaceRaUm} µm`
    case 'log_batch_qty':
      return `batch of ${q.batchQty.toLocaleString()} vs ${c.batchQty.toLocaleString()}`
    case 'part_family':
      return `${q.partFamily} vs ${c.partFamily}`
    case 'surface_treat':
      return `${q.surfaceTreat} vs ${c.surfaceTreat}`
    case 'process':
      return `${q.process} vs ${c.process}`
    default:
      return ''
  }
}

/** The three things that most separate this match from the query, in the order
 *  that actually matters — weighted by how much each contributed to the distance. */
export function explain(q: Part, c: Part, model: Model, avail?: Set<string>): Difference[] {
  const contributions: { f: string; v: number }[] = []
  let wsum = 0
  for (const f of NUMERIC_FEATURES) {
    if (avail && !avail.has(f)) continue
    const w = model.weights[f] ?? 0
    if (w <= 0) continue
    const range = model.ranges[f] || 1
    const d = Math.min(Math.abs(numericFeature(q, f) - numericFeature(c, f)) / range, 1)
    contributions.push({ f, v: w * d })
    wsum += w
  }
  for (const f of CATEGORICAL_FEATURES) {
    if (avail && !avail.has(f)) continue
    const w = model.weights[f] ?? 0
    if (w <= 0) continue
    contributions.push({ f, v: w * (categoricalFeature(q, f) === categoricalFeature(c, f) ? 0 : 1) })
    wsum += w
  }
  const totalDistance = contributions.reduce((a, b) => a + b.v, 0)
  return contributions
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((c2) => ({
      label: LABELS[c2.f] ?? c2.f,
      detail: describe(c2.f, q, c),
      share: totalDistance > 0 ? c2.v / totalDistance : 0,
    }))
}

// ------------------------------------------------------------------ engine ---

export class Engine {
  private matrix: FeatureMatrix
  private years: Float64Array

  constructor(
    readonly catalogue: Part[],
    readonly model: Model,
    readonly alloys: AlloyTable,
  ) {
    this.matrix = buildMatrix(catalogue)
    this.years = new Float64Array(catalogue.length)
    for (let i = 0; i < catalogue.length; i++) {
      const d = catalogue[i].quoteDate
      this.years[i] = parseInt(d.slice(0, 4), 10) + parseInt(d.slice(5, 7), 10) / 12
    }
  }

  /** Hard filter. In enriched mode the alloy family is the gate, because a part
   *  quoted in aluminium tells you nothing about the same shape in Inconel. In
   *  raw mode we have no alloy table, so all we can do is match the grade string
   *  literally — which is exactly why raw mode scores worse. */
  private candidates(query: Part, mode: 'raw' | 'enriched', k: number) {
    const cat = this.catalogue
    const shape = (i: number) => cat[i].shapeClass === query.shapeClass
    const self = (i: number) => cat[i].publicId === query.publicId

    const tiers =
      mode === 'enriched'
        ? [
            (i: number) => cat[i].alloyFamily === query.alloyFamily && shape(i),
            (i: number) => cat[i].alloyFamily === query.alloyFamily,
            () => true,
          ]
        : [
            (i: number) => cat[i].grade === query.grade && shape(i),
            (i: number) => shape(i),
            () => true,
          ]

    for (let t = 0; t < tiers.length; t++) {
      const idx: number[] = []
      for (let i = 0; i < cat.length; i++) if (!self(i) && tiers[t](i)) idx.push(i)
      if (idx.length >= k) return { idx, relaxed: t > 0 }
      if (t === tiers.length - 1) return { idx, relaxed: true }
    }
    return { idx: [] as number[], relaxed: true }
  }

  query(query: Part, opts: QueryOptions = {}): MatchResult {
    const k = opts.k ?? 10
    const mode = opts.mode ?? 'enriched'
    const avail = opts.available
    const toYear = opts.toYear ?? new Date().getFullYear() + new Date().getMonth() / 12
    const model = this.model

    // Raw mode has no density table, so part mass is not a feature it can use.
    const effective =
      mode === 'raw'
        ? new Set([...(avail ?? new Set([...NUMERIC_FEATURES, ...CATEGORICAL_FEATURES]))].filter(
            (f) => f !== 'log_part_mass',
          ))
        : avail

    const { idx, relaxed } = this.candidates(query, mode, k)

    const nf = NUMERIC_FEATURES.length
    const qNum = new Float32Array(nf)
    for (let j = 0; j < nf; j++) qNum[j] = numericFeature(query, NUMERIC_FEATURES[j])
    const qCat = CATEGORICAL_FEATURES.map((f) => categoricalFeature(query, f))

    const scored = idx.map((i) => ({
      i,
      d: distanceTo(qNum, qCat, this.matrix, i, model, effective),
    }))
    scored.sort((a, b) => a.d - b.d)
    const top = scored.slice(0, k)

    const slope = model.qtySlope[query.alloyFamily] ?? model.qtySlope._pooled ?? -0.15
    const matches: Match[] = top.map((s, n) => {
      const part = this.catalogue[s.i]
      return {
        rank: n + 1,
        part,
        distance: s.d,
        band: bandFor(s.d, model),
        adjustedPriceEur: adjustPrice(
          part.unitPriceEur,
          part.batchQty,
          query.batchQty,
          this.years[s.i],
          toYear,
          slope,
          model.priceDrift,
        ),
        differences: explain(query, part, model, effective),
      }
    })

    const noPrecedent = matches.length === 0 || matches[0].distance > model.bands.guardrail
    const alloy = this.alloys.get(query.grade)

    return {
      query,
      matches,
      anchor: noPrecedent ? null : priceAnchor(matches),
      noPrecedent,
      relaxed,
      candidatePool: idx.length,
      carbonKgCo2e:
        mode === 'enriched' && alloy ? +(query.stockMassKg * alloy.co2Kg).toFixed(2) : null,
      substitutions: mode === 'enriched' ? this.alloys.substitutesFor(query.grade) : [],
      mode,
    }
  }
}

export { stockVolumeCm3 }
export type { AlloyGrade }
