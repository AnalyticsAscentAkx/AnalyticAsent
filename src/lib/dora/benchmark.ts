// The only EU-wide picture of ICT third-party dependence that exists in public.
//
// ESAs, "Report on the landscape of ICT third-party providers in the EU"
// (ESA 2023 22, 27 September 2023): a 2022 data collection from about 1,600
// financial entities, reference date end-2021. It predates the Register of
// Information and uses its own service categories, so the mapping to the
// S01–S19 taxonomy below is ours and approximate. It is still the only
// published baseline for "what share of this kind of service is critical".
//
// Also here: the 2024 dry-run failure breakdown (ESA 2024 35), which is the
// public evidence for which checks matter.

import type { Register } from './types'
import { serviceMix } from './tables'

export const LANDSCAPE_SOURCE = {
  title: 'ESAs report on the landscape of ICT third-party providers in the EU (ESA 2023 22)',
  url: 'https://www.esma.europa.eu/sites/default/files/2023-09/ESA_2023_22_-_ESAs_report_on_the_landscape_of_ICT_TPPs.pdf',
  date: '2023-09-27',
  entities: 1600,
  providers: 15077,
  arrangements: 56313,
}

export interface LandscapeCategory {
  key: string
  label: string
  /** Contractual arrangements in the 2022 collection. */
  arrangements: number
  /** Share of those arrangements supporting a critical or important function. */
  criticalShare: number
  /** Share of entities using the category for a critical function. */
  entityShareCritical: number
  /** Our mapping to RoI service-type codes. */
  codes: string[]
}

export const LANDSCAPE: LandscapeCategory[] = [
  { key: 'software', label: 'Software and applications', arrangements: 30138, criticalShare: 0.45, entityShareCritical: 0.88, codes: ['S02', 'S13'] },
  { key: 'consultancy', label: 'ICT consultancy and managed services', arrangements: 13560, criticalShare: 0.49, entityShareCritical: 0.83, codes: ['S01', 'S03', 'S14', 'S15', 'S16'] },
  { key: 'cloud', label: 'Cloud computing', arrangements: 13111, criticalShare: 0.55, entityShareCritical: 0.85, codes: ['S17', 'S18', 'S19'] },
  { key: 'data', label: 'Data analysis and provision', arrangements: 11873, criticalShare: 0.64, entityShareCritical: 0.8, codes: ['S05', 'S06', 'S08'] },
  { key: 'security', label: 'Information security', arrangements: 5648, criticalShare: 0.49, entityShareCritical: 0.86, codes: ['S04'] },
  { key: 'network', label: 'Network infrastructure', arrangements: 4869, criticalShare: 0.67, entityShareCritical: 0.92, codes: ['S10', 'S11', 'S12'] },
  { key: 'datacentre', label: 'Data centre and hosting', arrangements: 3694, criticalShare: 0.7, entityShareCritical: 0.92, codes: ['S07', 'S09'] },
]

export const DRY_RUN_SOURCE = {
  title: 'ESAs Dry Run exercise summary report (ESA 2024 35)',
  url: 'https://www.esma.europa.eu/sites/default/files/2024-12/ESA_2024_35_DORA_Dry_Run_exercise_summary_report.pdf',
  date: '2024-12-17',
  submitted: 1039,
  analysed: 947,
  passedAll: 0.065,
}

/** Where the 235,000 failed checks fell. */
export const DRY_RUN_FAILURES: { label: string; share: number }[] = [
  { label: 'Missing mandatory information', share: 0.86 },
  { label: 'Invalid LEI', share: 0.065 },
  { label: 'Value not in the closed list', share: 0.04 },
  { label: 'Duplicates and invalid dates', share: 0.028 },
]

/** Where the missing information was, within that 86%. */
export const DRY_RUN_MISSING_BY_TEMPLATE: { label: string; share: number }[] = [
  { label: 'B_02.02 contractual arrangements', share: 0.6 },
  { label: 'B_07.01 assessment of ICT services', share: 0.2 },
  { label: 'B_05.01 ICT third-party providers', share: 0.17 },
]

export interface BenchmarkRow {
  category: LandscapeCategory
  rows: number
  critical: number
  /** Critical share in this register; null when the category is absent. */
  share: number | null
}

/** This register's critical share per landscape category, next to the EU figure. */
export function benchmark(reg: Register): BenchmarkRow[] {
  const mix = serviceMix(reg)
  return LANDSCAPE.map((category) => {
    const rows = mix.filter((m) => category.codes.includes(m.code))
    const n = rows.reduce((s, r) => s + r.rows, 0)
    const c = rows.reduce((s, r) => s + r.critical, 0)
    return { category, rows: n, critical: c, share: n > 0 ? c / n : null }
  })
}
