// CM Optimiser — loading the catalogue, and making sense of a grade string.

import type { AlloyGrade, Part } from './types'

interface ColumnarCatalogue {
  n: number
  date_base: string
  dict: Record<string, string[]>
  cols: Record<string, (number | string)[]>
}

/** Rebuild the dictionary-encoded catalogue into plain objects. */
export function decodeCatalogue(blob: ColumnarCatalogue): Part[] {
  const { cols, dict, n } = blob
  const base = Date.parse(blob.date_base ?? '2021-01-01')
  const cat = (name: string, i: number) => dict[name][cols[name][i] as number]
  const num = (name: string, i: number) => cols[name][i] as number

  const parts: Part[] = new Array(n)
  for (let i = 0; i < n; i++) {
    parts[i] = {
      publicId: cols.public_id[i] as string,
      partFamily: cat('part_family', i),
      shapeClass: cat('shape_class', i) as Part['shapeClass'],
      grade: cat('grade', i),
      alloyFamily: cat('alloy_family', i),
      process: cat('process', i),
      envL: num('env_l_mm', i),
      envW: num('env_w_mm', i),
      envH: num('env_h_mm', i),
      stockMassKg: num('stock_mass_kg', i),
      partMassKg: num('part_mass_kg', i),
      nFeatures: num('n_features', i),
      nSetups: num('n_setups', i),
      tightestTolMm: num('tightest_tol_mm', i),
      surfaceRaUm: num('surface_Ra_um', i),
      heatTreat: cat('heat_treat', i),
      surfaceTreat: cat('surface_treat', i),
      annualQty: num('annual_qty', i),
      batchQty: num('batch_qty', i),
      quoteDate: new Date(base + num('quote_date', i) * 86400000)
        .toISOString()
        .slice(0, 10),
      unitPriceEur: num('unit_price_eur', i),
      won: num('won', i) === 1,
    }
  }
  return parts
}

// ----------------------------------------------------------------- alloys ---

/** Strip everything that is not a letter or a digit. "EN AW-6082" and
 *  "en_aw_6082" are the same material written by two different ERP systems. */
export function gradeKey(s: string): string {
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export class AlloyTable {
  readonly grades: AlloyGrade[]
  private byGrade = new Map<string, AlloyGrade>()
  private lookup = new Map<string, string>()
  private keysByLength: string[] = []

  constructor(grades: AlloyGrade[]) {
    this.grades = grades
    for (const g of grades) {
      this.byGrade.set(g.grade, g)
      const k = gradeKey(g.grade)
      if (!this.lookup.has(k)) this.lookup.set(k, g.grade)
      for (const a of g.aliases) {
        const ak = gradeKey(a)
        if (!this.lookup.has(ak)) this.lookup.set(ak, g.grade)
      }
    }
    // Longest first, so "TI6AL4VELI" wins over "TI6AL4V" inside a longer string.
    this.keysByLength = [...this.lookup.keys()].sort((a, b) => b.length - a.length)
  }

  get(grade: string): AlloyGrade | undefined {
    return this.byGrade.get(grade)
  }

  /** Resolve however the customer wrote it to a grade we hold properties for.
   *  Exact key first; failing that, the longest known alias appearing inside the
   *  string, which is what rescues "MATERIAL TI6AL4V - SEE DWG". */
  resolve(written: string): string | null {
    const key = gradeKey(written)
    if (!key) return null
    const exact = this.lookup.get(key)
    if (exact) return exact
    for (const k of this.keysByLength) {
      if (k.length >= 4 && key.includes(k)) return this.lookup.get(k)!
    }
    return null
  }

  /** Same family, at least as strong, and cheaper or lighter in carbon.
   *  The line a procurement lead forwards internally without editing it. */
  substitutesFor(grade: string) {
    const g = this.byGrade.get(grade)
    if (!g) return []
    return this.grades
      .filter(
        (c) =>
          c.grade !== g.grade &&
          c.family === g.family &&
          c.uts >= g.uts &&
          (c.eurKg < g.eurKg || c.co2Kg < g.co2Kg),
      )
      .map((c) => ({
        grade: c.grade,
        uts: c.uts,
        eurKg: c.eurKg,
        co2Kg: c.co2Kg,
        savesEurPerKg: +(g.eurKg - c.eurKg).toFixed(2),
        savesCo2PerKg: +(g.co2Kg - c.co2Kg).toFixed(2),
      }))
      .sort((a, b) => b.savesEurPerKg - a.savesEurPerKg)
      .slice(0, 3)
  }
}

// ------------------------------------------------------------- dimensions ---

export interface ParsedDimensions {
  dims: number[]
  /** True when the source was inches and we converted. */
  converted: boolean
  /** True when the string described a round bar as diameter x length. */
  rotational: boolean
}

const INCH_HINT = /("|''|\bin\b|\binch(es)?\b|\bipt\b)/i
const MM_HINT = /\b(mm|millimet(re|er)s?)\b/i
const DIA_HINT = /[ØøΦφ⌀]|\bdia\b|\bdiam(eter)?\b|^d\s*[\d.]/i

/** Pull dimensions out of a free-text cell: "Ø40 x 120", "100 x 50 x 20 mm",
 *  '4.5" x 2.0"', "40*120". Returns null when there is nothing to find.
 *
 *  Deliberately boring and local. An LLM would parse more exotic strings, but it
 *  would also mean shipping the customer's part list to someone else's server,
 *  which is the one thing this tool promises not to do. */
export function parseDimensions(text: string): ParsedDimensions | null {
  if (!text) return null
  const s = String(text).trim()
  if (!s) return null

  const numbers = s.match(/\d+(?:[.,]\d+)?/g)
  if (!numbers || numbers.length === 0) return null

  let dims = numbers.map((n) => parseFloat(n.replace(',', '.'))).filter((n) => n > 0)
  if (dims.length === 0) return null
  dims = dims.slice(0, 3)

  const inches = INCH_HINT.test(s) && !MM_HINT.test(s)
  if (inches) dims = dims.map((d) => d * 25.4)

  const rotational = DIA_HINT.test(s) || dims.length === 2
  // A round bar given as diameter x length is really a D x D x L bounding box.
  if (rotational && dims.length === 2) {
    const [a, b] = dims
    const dia = Math.min(a, b)
    const len = Math.max(a, b)
    dims = [len, dia, dia]
  }
  while (dims.length < 3) dims.push(dims[dims.length - 1])

  return { dims, converted: inches, rotational }
}

/** Stock volume in cm³ from a bounding box in mm. */
export function stockVolumeCm3(shape: Part['shapeClass'], l: number, w: number, h: number) {
  if (shape === 'rotational') return (Math.PI / 4) * (w / 10) ** 2 * (l / 10)
  return (l / 10) * (w / 10) * (h / 10)
}

export const ROTATIONAL_FAMILIES = new Set([
  'shaft',
  'bushing',
  'pin',
  'gear blank',
  'fitting',
])

export function shapeFor(partFamily: string): Part['shapeClass'] {
  return ROTATIONAL_FAMILIES.has(partFamily.toLowerCase()) ? 'rotational' : 'prismatic'
}
