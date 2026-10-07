// Shared shapes for the register checker.

export type Severity = 'reject' | 'warning' | 'insight'

/** Which pass produced the finding, in the order the EBA runs them. */
export type Layer = 'package' | 'structure' | 'keys' | 'values' | 'business' | 'identifiers' | 'intelligence'

export interface Finding {
  /** EBA rule code where one exists (e.g. 807, v8850_m, VR_71); AA-prefixed where the check is ours. */
  rule: string
  layer: Layer
  severity: Severity
  /** Template code B_xx.xx, or 'package' for file-level findings. */
  template: string
  /** 1-based data row (header excluded), when the finding is about a row. */
  row?: number
  column?: string
  message: string
  value?: string
}

export interface TableData {
  code: string
  header: string[]
  rows: string[][]
  /** Where the table came from, for the report. */
  source: string
  ragged: number[]
  semicolons: boolean
}

export interface PackageMeta {
  /** The zip's file name, when a zip was dropped. */
  zipName?: string
  /** Root folder inside the zip, if any. */
  root?: string
  hasMetaInf: boolean
  hasReportJson: boolean
  reportJsonExtends?: string
  parameters?: Record<string, string>
  parametersHeader?: string[]
  filingIndicators?: Record<string, string>
  filingHeader?: string[]
  /** Files in reports/ that are not one of the fifteen tables or the three metadata files. */
  strayFiles: string[]
  /** Files that were not valid UTF-8. */
  badEncoding: string[]
  kind: 'zip' | 'csv' | 'xlsx' | 'sample'
}

export interface Register {
  meta: PackageMeta
  tables: Record<string, TableData>
}

/** Finding, with the row and template resolved to a stable key for grouping. */
export const findingKey = (f: Finding) => `${f.rule}|${f.template}|${f.column ?? ''}`
