// Unit economics: the model, its sensitivity, and a forecast.
//
// Most business cases are one assumption wearing a spreadsheet. The arithmetic
// of break-even is trivial and nobody needs help with it; what people need is
// to find out which input the answer actually turns on, and how wrong that
// input can be before the conclusion flips. So the sensitivity pass is the
// point of this file, not a garnish on it.
//
// Runs in the browser. Nothing is uploaded.

export interface CostLine {
  id: string
  name: string
  /** Cost per unit, in the same currency as price. */
  perUnit: number
}

export interface Model {
  currency: string
  /** Singular, as it would appear mid-sentence: "per tonne collected". */
  unitName: string
  /** Plural, given explicitly because English does not pluralise phrases by
   *  appending an s — "tonne collected" becomes "tonnes collected", not
   *  "tonne collecteds". */
  unitPlural: string
  periodName: string
  pricePerUnit: number
  variableCosts: CostLine[]
  fixedCostsPerPeriod: number
  volumePerPeriod: number
  /** Optional ceiling on what can be produced or served in a period. */
  capacityPerPeriod?: number
}

export interface Result {
  variableCostPerUnit: number
  contributionPerUnit: number
  contributionRatio: number
  revenue: number
  variableCosts: number
  grossContribution: number
  profit: number
  breakEvenVolume: number | null
  breakEvenRevenue: number | null
  marginOfSafety: number | null
  capacityUtilisation: number | null
  /** True when no volume can ever cover fixed costs at this price. */
  impossible: boolean
}

export function evaluate(m: Model): Result {
  const variableCostPerUnit = m.variableCosts.reduce((a, c) => a + (c.perUnit || 0), 0)
  const contributionPerUnit = m.pricePerUnit - variableCostPerUnit
  const revenue = m.pricePerUnit * m.volumePerPeriod
  const variableCosts = variableCostPerUnit * m.volumePerPeriod
  const grossContribution = contributionPerUnit * m.volumePerPeriod
  const profit = grossContribution - m.fixedCostsPerPeriod

  const impossible = contributionPerUnit <= 0
  const breakEvenVolume = impossible ? null : m.fixedCostsPerPeriod / contributionPerUnit
  const breakEvenRevenue = breakEvenVolume === null ? null : breakEvenVolume * m.pricePerUnit

  return {
    variableCostPerUnit,
    contributionPerUnit,
    contributionRatio: m.pricePerUnit > 0 ? contributionPerUnit / m.pricePerUnit : 0,
    revenue,
    variableCosts,
    grossContribution,
    profit,
    breakEvenVolume,
    breakEvenRevenue,
    marginOfSafety:
      breakEvenVolume === null || m.volumePerPeriod <= 0
        ? null
        : (m.volumePerPeriod - breakEvenVolume) / m.volumePerPeriod,
    capacityUtilisation:
      m.capacityPerPeriod && m.capacityPerPeriod > 0
        ? m.volumePerPeriod / m.capacityPerPeriod
        : null,
    impossible,
  }
}

// ------------------------------------------------------------ sensitivity ---

export interface Sensitivity {
  input: string
  /** Profit when this input is moved down and up by the same relative amount. */
  low: number
  high: number
  /** Width of the swing: how much this one input moves the answer. */
  swing: number
  /** The input value at which profit becomes exactly zero, if reachable. */
  breakEvenValue: number | null
}

type Setter = (m: Model, v: number) => Model
type Getter = (m: Model) => number

function inputs(m: Model): { name: string; get: Getter; set: Setter }[] {
  const list: { name: string; get: Getter; set: Setter }[] = [
    {
      name: 'Price per unit',
      get: (x) => x.pricePerUnit,
      set: (x, v) => ({ ...x, pricePerUnit: v }),
    },
    {
      name: 'Volume',
      get: (x) => x.volumePerPeriod,
      set: (x, v) => ({ ...x, volumePerPeriod: v }),
    },
    {
      name: 'Fixed costs',
      get: (x) => x.fixedCostsPerPeriod,
      set: (x, v) => ({ ...x, fixedCostsPerPeriod: v }),
    },
  ]
  m.variableCosts.forEach((c, i) => {
    list.push({
      name: c.name || `Variable cost ${i + 1}`,
      get: (x) => x.variableCosts[i]?.perUnit ?? 0,
      set: (x, v) => ({
        ...x,
        variableCosts: x.variableCosts.map((y, j) => (j === i ? { ...y, perUnit: v } : y)),
      }),
    })
  })
  return list
}

/** Move each input by ±`pct` and see what happens to profit. Sorted by how much
 *  the answer moves, because that ordering is the actual finding: the top row
 *  is the assumption worth arguing about, and the bottom rows are not. */
export function sensitivity(m: Model, pct = 0.2): Sensitivity[] {
  const base = evaluate(m).profit
  const out = inputs(m).map(({ name, get, set }) => {
    const v = get(m)
    const low = evaluate(set(m, v * (1 - pct))).profit
    const high = evaluate(set(m, v * (1 + pct))).profit
    return {
      input: name,
      low,
      high,
      swing: Math.abs(high - low),
      breakEvenValue: solveForZero(m, get, set),
    }
  })
  out.sort((a, b) => b.swing - a.swing)
  void base
  return out
}

/** What would this input have to be for profit to be exactly zero, holding
 *  everything else still. Bisection rather than algebra so the same routine
 *  works for every input without special cases. */
function solveForZero(m: Model, get: Getter, set: Setter): number | null {
  const v0 = get(m)
  if (!Number.isFinite(v0)) return null
  const f = (v: number) => evaluate(set(m, v)).profit

  let lo = 0
  let hi = Math.max(v0 * 4, v0 + 1, 1)
  const flo = f(lo)
  const fhi = f(hi)
  if (!Number.isFinite(flo) || !Number.isFinite(fhi)) return null
  if (flo === 0) return lo
  if (fhi === 0) return hi
  if (flo > 0 === fhi > 0) return null // no crossing in a plausible range

  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    const fm = f(mid)
    if (fm === 0) return mid
    if (fm > 0 === flo > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// --------------------------------------------------------------- forecast ---

export interface Forecast {
  fitted: number[]
  points: { period: number; value: number; low: number; high: number }[]
  /** Average absolute error of the one-step-ahead fit, in units. */
  mae: number
  method: string
  /** False when there is too little history to say anything useful. */
  usable: boolean
}

/** Holt's linear trend, with a prediction interval that widens with horizon.
 *
 *  Chosen because it is explainable in a sentence — a level that updates and a
 *  trend that updates — and because anything fancier on a dozen annual or
 *  monthly points is a way of looking confident rather than being right. The
 *  interval comes from the model's own one-step errors, so a series that has
 *  been unpredictable produces a visibly wide band instead of a tidy line. */
export function forecast(history: number[], horizon = 6, alpha = 0.5, beta = 0.3): Forecast {
  const clean = history.filter((v) => Number.isFinite(v))
  if (clean.length < 3) {
    return { fitted: [], points: [], mae: 0, method: 'not enough history', usable: false }
  }

  let level = clean[0]
  let trend = clean[1] - clean[0]
  const fitted: number[] = [clean[0]]
  const errors: number[] = []

  for (let t = 1; t < clean.length; t++) {
    const predicted = level + trend
    fitted.push(predicted)
    errors.push(clean[t] - predicted)
    const prevLevel = level
    level = alpha * clean[t] + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
  }

  const mae = errors.length
    ? errors.reduce((a, e) => a + Math.abs(e), 0) / errors.length
    : 0
  const sd = errors.length
    ? Math.sqrt(errors.reduce((a, e) => a + e * e, 0) / errors.length)
    : 0

  const points = Array.from({ length: horizon }, (_, i) => {
    const h = i + 1
    const value = level + h * trend
    // Interval widens with the square root of the horizon: uncertainty
    // accumulates, and pretending otherwise is the usual way a forecast lies.
    const spread = 1.96 * sd * Math.sqrt(h)
    return {
      period: clean.length + h,
      value,
      low: value - spread,
      high: value + spread,
    }
  })

  return {
    fitted,
    points,
    mae,
    method: "Holt's linear trend, 95% interval from the model's own one-step errors",
    usable: true,
  }
}

// ---------------------------------------------------------------- presets ---

export interface Preset {
  id: string
  label: string
  note: string
  model: Model
  history: number[]
}

export const PRESETS: Preset[] = [
  {
    id: 'collection',
    label: 'Waste collection round',
    note:
      'Modelled on a real engagement. The payload assumption is the one everything turned on — try moving it and watch the sensitivity order change.',
    model: {
      currency: '€',
      unitName: 'tonne collected',
      unitPlural: 'tonnes collected',
      periodName: 'month',
      pricePerUnit: 210,
      variableCosts: [
        { id: 'v1', name: 'Disposal gate fee', perUnit: 46 },
        { id: 'v2', name: 'Fuel', perUnit: 38 },
        { id: 'v3', name: 'Driver hours', perUnit: 52 },
        { id: 'v4', name: 'Vehicle maintenance', perUnit: 14 },
      ],
      fixedCostsPerPeriod: 11500,
      volumePerPeriod: 240,
      capacityPerPeriod: 300,
    },
    history: [181, 192, 188, 205, 211, 203, 219, 228, 222, 235, 241, 240],
  },
  {
    id: 'machined-part',
    label: 'Machined part, contract manufacturing',
    note:
      'A should-cost view of a single part: material, machine time, setup amortised over the batch, finishing. Useful for seeing how badly a small batch hurts.',
    model: {
      currency: '€',
      unitName: 'part',
      unitPlural: 'parts',
      periodName: 'month',
      pricePerUnit: 48,
      variableCosts: [
        { id: 'v1', name: 'Raw material', perUnit: 12.4 },
        { id: 'v2', name: 'Machine time', perUnit: 16.8 },
        { id: 'v3', name: 'Setup, amortised', perUnit: 3.2 },
        { id: 'v4', name: 'Finishing and treatment', perUnit: 4.1 },
        { id: 'v5', name: 'Scrap allowance', perUnit: 1.9 },
      ],
      fixedCostsPerPeriod: 18000,
      volumePerPeriod: 2400,
      capacityPerPeriod: 3200,
    },
    history: [1780, 1920, 2010, 1890, 2140, 2260, 2180, 2310, 2290, 2375, 2410, 2400],
  },
  {
    id: 'subscription',
    label: 'Subscription product',
    note:
      'Where the fixed base is large and the variable cost is small, volume dominates everything — which the sensitivity ordering shows immediately.',
    model: {
      currency: '€',
      unitName: 'subscriber',
      unitPlural: 'subscribers',
      periodName: 'month',
      pricePerUnit: 39,
      variableCosts: [
        { id: 'v1', name: 'Hosting and infrastructure', perUnit: 2.1 },
        { id: 'v2', name: 'Payment processing', perUnit: 1.3 },
        { id: 'v3', name: 'Support', perUnit: 4.6 },
      ],
      fixedCostsPerPeriod: 42000,
      volumePerPeriod: 1600,
    },
    history: [980, 1065, 1140, 1190, 1255, 1310, 1388, 1420, 1495, 1540, 1572, 1600],
  },
]
