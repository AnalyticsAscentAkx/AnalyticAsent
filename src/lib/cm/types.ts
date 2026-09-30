// CM Optimiser — shared types.
//
// The engine runs entirely in the visitor's browser. Nothing here ever travels
// to a server, which is the whole point: a machine shop's quote history is the
// most commercially sensitive file it owns.

/** A part as the engine understands it, once enrichment has done its work. */
export interface Part {
  publicId: string
  partFamily: string
  shapeClass: 'rotational' | 'prismatic'
  grade: string
  alloyFamily: string
  process: string
  envL: number
  envW: number
  envH: number
  stockMassKg: number
  partMassKg: number
  nFeatures: number
  nSetups: number
  tightestTolMm: number
  surfaceRaUm: number
  heatTreat: string
  surfaceTreat: string
  annualQty: number
  batchQty: number
  quoteDate: string
  unitPriceEur: number
  won: boolean
}

/** A row as it arrived — before we decided what any of it means. */
export interface RawRow {
  [column: string]: string
}

/** What the enrichment layer made of one incoming row. */
export interface EnrichedRow {
  part: Partial<Part>
  /** Columns we recognised, and what we mapped them to. */
  mapped: Record<string, string>
  /** Why this row is less trustworthy than the others. */
  flags: EnrichmentFlag[]
  /** True when the row carries enough to be matched at all. */
  usable: boolean
}

export type EnrichmentFlag =
  | { kind: 'grade-unresolved'; written: string }
  | { kind: 'grade-normalised'; written: string; resolved: string }
  | { kind: 'dimensions-parsed'; written: string }
  | { kind: 'units-converted'; from: 'in' | 'mm'; written: string }
  | { kind: 'mass-derived' }
  | { kind: 'missing'; field: string }

export interface AlloyGrade {
  grade: string
  family: string
  density: number
  mach: number
  uts: number
  eurKg: number
  co2Kg: number
  aliases: string[]
}

export interface Model {
  version: string
  features: { numeric: string[]; categorical: string[] }
  weights: Record<string, number>
  ranges: Record<string, number>
  bands: { high: number; medium: number; guardrail: number }
  /** Share of neighbours in each band that are genuinely the same design. */
  bandPrecision: { high: number; medium: number; low: number }
  qtySlope: Record<string, number>
  priceDrift: number
  benchmark: Benchmark
}

export interface Benchmark {
  nCatalogue: number
  nDesigns: number
  nQueries: number
  recallAt10: number
  hitAt10: number
  recallAt10Untuned: number
  tuningGainPoints: number
  priceMape: number
  priceMedape: number
  priceRangeCoverage: number
  naiveMape: number
  naiveMedape: number
  naiveLabel: string
  messy: {
    grade_parsed_rate: number
    recall_raw: number
    recall_enriched: number
    enrichment_gain_points: number
    grade_mix: Record<string, number>
    dim_mix: Record<string, number>
  }
}

export type MatchBand = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Difference {
  label: string
  detail: string
  /** Share of the total distance this one difference accounts for, 0–1. */
  share: number
}

export interface Match {
  rank: number
  part: Part
  distance: number
  band: MatchBand
  /** The historical price moved onto the query's quantity and today's date. */
  adjustedPriceEur: number
  differences: Difference[]
}

export interface PriceAnchor {
  point: number
  low: number
  high: number
}

export interface Substitution {
  grade: string
  uts: number
  eurKg: number
  co2Kg: number
  savesEurPerKg: number
  savesCo2PerKg: number
}

export interface MatchResult {
  query: Part
  matches: Match[]
  anchor: PriceAnchor | null
  /** True when even the nearest neighbour is further than the benchmark's 95th
   *  percentile. The tool says so rather than inventing a number. */
  noPrecedent: boolean
  /** True when the alloy-family filter had to be dropped to find anyone. */
  relaxed: boolean
  candidatePool: number
  /** Cradle-to-gate material carbon, indicative only. */
  carbonKgCo2e: number | null
  substitutions: Substitution[]
  mode: 'raw' | 'enriched'
}
