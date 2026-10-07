// The DORA Register of Information data model, as the EBA publishes it.
//
// schema.json is generated from the EBA XBRL taxonomy package 4.0 (DORA module
// 1.1.0): the fifteen tables, their columns and types, the primary keys the
// receiving system enforces as rule 805/806, the foreign keys it enforces as
// rule 807, and every closed list a cell may draw from, with the exact
// `eba_XX:code` strings a submission must contain. Nothing in here is typed by
// hand except the column labels, which the taxonomy stores in a layout file
// that does not map cleanly back to column codes.

import raw from './schema.json'

export type ColumnType = 's' | 'e' | 'd' | 'i' | 'm' | 't'

export interface Column {
  code: string
  label: string
  type: ColumnType
  /** Key into DOMAINS for enumerated columns. */
  domain?: string
}

export interface Reference {
  name: string
  columns: string[]
  table: string
}

export interface Table {
  code: string
  /** Lower-case file stem, e.g. `b_02.02`. */
  file: string
  label: string
  columns: Column[]
  primary: string[]
  references: Reference[]
}

export const TABLES: Table[] = raw.tables as Table[]
export const DOMAINS: Record<string, Record<string, string>> = raw.domains

const BY_CODE = new Map(TABLES.map((t) => [t.code, t]))
const BY_FILE = new Map(TABLES.map((t) => [t.file, t]))

export const tableByCode = (code: string) => BY_CODE.get(code)
export const tableByFile = (file: string) => BY_FILE.get(file.toLowerCase())

export function column(table: Table, code: string): Column | undefined {
  return table.columns.find((c) => c.code === code)
}

/** Human label for an enumerated value, or the raw code when unknown. */
export function memberLabel(domain: string | undefined, value: string): string {
  if (!domain) return value
  return DOMAINS[domain]?.[value] ?? value
}

/** Short codes used throughout the rules. */
export const V = {
  YES: 'eba_BT:x28',
  NO: 'eba_BT:x29',
  NOT_ASSESSED: 'eba_BT:x21',
  LEI: 'eba_qCO:qx2000',
  EUID: 'eba_qCO:qx2002',
  NOT_APPLICABLE_COUNTRY: 'eba_GA:qx2007',
  NON_FINANCIAL_ICT: 'eba_CT:x317',
  NON_FINANCIAL_OTHER: 'eba_CT:x318',
  SUBSEQUENT_ARRANGEMENT: 'eba_CO:x3',
  NOT_SUBSTITUTABLE: 'eba_ZZ:x959',
  HIGHLY_COMPLEX_SUBSTITUTABILITY: 'eba_ZZ:x960',
  CLOUD: new Set(['eba_TA:S17', 'eba_TA:S18', 'eba_TA:S19']),
} as const

/** The fifteen template codes in reporting order. */
export const TEMPLATE_CODES = TABLES.map((t) => t.code)
