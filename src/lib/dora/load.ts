// Turn what the visitor dropped into a Register: fifteen tables plus the
// package metadata the EBA's reception checks look at.
//
// Three shapes are accepted. The zip is the thing an NCA actually receives, so
// it gets the full package checks. A folder's worth of CSVs is what people
// have before they zip. A workbook is what many NCAs' Excel templates produce
// and what most registers are maintained in; sheets are matched to templates
// by name and the header row is found by looking for `c0010`-style codes.

import { parseCsv } from './csv'
import { tableByCode, tableByFile, TABLES } from './schema'
import type { PackageMeta, Register, TableData } from './types'
import { looksUtf8, readZip } from './zip'

const META_FILES = new Set(['report.json', 'filingindicators.csv', 'parameters.csv', 'footnotes.csv'])

export async function loadRegister(files: File[]): Promise<Register> {
  if (files.length === 1 && /\.zip$/i.test(files[0].name)) return loadZip(files[0])
  if (files.length === 1 && /\.xlsx$/i.test(files[0].name)) return loadWorkbook(files[0])
  if (files.some((f) => /\.xls$/i.test(f.name))) {
    throw new Error('This is the old .xls format. Save it as .xlsx, or export the sheets as CSV.')
  }
  const csvs = files.filter((f) => /\.csv$/i.test(f.name))
  if (csvs.length === 0) {
    throw new Error('Drop the report package (.zip), the fifteen CSV files, or the register workbook (.xlsx).')
  }
  return loadCsvFiles(csvs)
}

async function loadZip(file: File): Promise<Register> {
  const entries = await readZip(await file.arrayBuffer())
  const meta: PackageMeta = {
    kind: 'zip',
    zipName: file.name,
    hasMetaInf: false,
    hasReportJson: false,
    strayFiles: [],
    badEncoding: [],
  }
  const tables: Record<string, TableData> = {}
  // Root folder: everything should sit under one directory named like the zip.
  // Root folder: every entry should sit under one directory named like the
  // zip. Entry names in the archive are paths, so the first segment of any
  // path with at least two segments is a candidate; the name itself contains
  // dots, so that is not a usable tell.
  const roots = new Set(entries.map((e) => e.name.split('/')).filter((p) => p.length >= 2).map((p) => p[0]))
  if (roots.size === 1) meta.root = [...roots][0]
  const dec = new TextDecoder('utf-8')
  for (const e of entries) {
    const parts = e.name.split('/')
    const base = parts[parts.length - 1]
    const dir = parts.slice(0, -1).join('/').toLowerCase()
    const lower = base.toLowerCase()
    if (lower === 'reportpackage.json' && dir.endsWith('meta-inf')) {
      meta.hasMetaInf = true
      continue
    }
    if (!dir.endsWith('reports')) {
      if (base) meta.strayFiles.push(e.name)
      continue
    }
    if (!looksUtf8(e.bytes)) meta.badEncoding.push(e.name)
    const text = dec.decode(e.bytes)
    if (lower === 'report.json') {
      meta.hasReportJson = true
      try {
        const j = JSON.parse(text)
        meta.reportJsonExtends = j?.documentInfo?.extends?.[0]
      } catch {
        meta.reportJsonExtends = 'unparseable'
      }
      continue
    }
    if (lower === 'parameters.csv') {
      const p = parseCsv(text)
      meta.parametersHeader = p.header
      meta.parameters = Object.fromEntries(p.rows.map((r) => [r[0]?.trim(), r[1]?.trim() ?? '']))
      continue
    }
    if (lower === 'filingindicators.csv') {
      const p = parseCsv(text)
      meta.filingHeader = p.header
      meta.filingIndicators = Object.fromEntries(p.rows.map((r) => [r[0]?.trim(), r[1]?.trim() ?? '']))
      continue
    }
    if (META_FILES.has(lower)) continue
    const stem = base.replace(/\.csv$/i, '')
    const t = tableByFile(stem)
    if (!t || !/\.csv$/i.test(base)) {
      meta.strayFiles.push(e.name)
      continue
    }
    tables[t.code] = toTable(t.code, text, base !== `${t.file}.csv` ? `${e.name} (case differs)` : e.name)
  }
  return { meta, tables }
}

async function loadCsvFiles(files: File[]): Promise<Register> {
  const meta: PackageMeta = { kind: 'csv', hasMetaInf: false, hasReportJson: false, strayFiles: [], badEncoding: [] }
  const tables: Record<string, TableData> = {}
  for (const f of files) {
    const stem = f.name.replace(/\.csv$/i, '')
    const t = tableByFile(stem) ?? guessTable(stem)
    if (!t) {
      meta.strayFiles.push(f.name)
      continue
    }
    const bytes = new Uint8Array(await f.arrayBuffer())
    if (!looksUtf8(bytes)) meta.badEncoding.push(f.name)
    tables[t.code] = toTable(t.code, new TextDecoder('utf-8').decode(bytes), f.name)
  }
  return { meta, tables }
}

/** `B_02.02`, `b_02_02`, `B0202`, `RT.02.02` and `B_02.02 Contractual…` all mean the same sheet. */
function guessTable(name: string) {
  const m = name.match(/(?:B|RT)[\s_.-]?0?(\d)[\s_.-]?0?(\d)(?!\d)/i)
  if (!m) return undefined
  return tableByCode(`B_0${m[1]}.0${m[2]}`)
}

async function loadWorkbook(file: File): Promise<Register> {
  const mod = await import('read-excel-file/browser')
  // The library's typings lag its API: `getSheets` and `sheet` are documented
  // options that the Options type does not declare.
  const readXlsxFile = mod.default as unknown as (f: File, opts?: Record<string, unknown>) => Promise<unknown>
  const sheets = (await readXlsxFile(file, { getSheets: true })) as { name: string }[]
  const meta: PackageMeta = { kind: 'xlsx', hasMetaInf: false, hasReportJson: false, strayFiles: [], badEncoding: [] }
  const tables: Record<string, TableData> = {}
  for (const s of sheets) {
    const t = guessTable(s.name)
    if (!t) continue
    const matrix = (await readXlsxFile(file, { sheet: s.name })) as unknown[][]
    // The header is the first row with at least two cXXXX codes in it; the
    // official templates put labels above the codes.
    const hi = matrix.findIndex((r) => r.filter((c) => /^c\d{4}$/i.test(String(c ?? '').trim())).length >= 2)
    if (hi < 0) {
      meta.strayFiles.push(`${s.name} (no c0010-style header row found)`)
      continue
    }
    const header = matrix[hi].map((c) => String(c ?? '').trim().toLowerCase())
    const rows = matrix
      .slice(hi + 1)
      .map((r) => header.map((_, i) => cell(r[i])))
      .filter((r) => r.some((v) => v !== ''))
    tables[t.code] = { code: t.code, header, rows, source: `sheet ${s.name}`, ragged: [], semicolons: false }
  }
  if (Object.keys(tables).length === 0) {
    throw new Error('No sheet named like a template (B_01.01 … B_99.01) with a row of column codes (c0010, c0020 …) was found.')
  }
  return { meta, tables }
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) {
    const iso = new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString()
    return iso.slice(0, 10)
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v).trim()
}

function toTable(code: string, text: string, source: string): TableData {
  const p = parseCsv(text)
  return { code, header: p.header.map((h) => h.toLowerCase()), rows: p.rows, source, ragged: p.ragged, semicolons: p.semicolons }
}

/** Build a register from in-memory CSV strings (used by the sample and tests). */
export function registerFromStrings(
  csvs: Record<string, string>,
  meta: Partial<PackageMeta> = {},
): Register {
  const tables: Record<string, TableData> = {}
  for (const t of TABLES) {
    const text = csvs[t.code] ?? csvs[t.file]
    if (text === undefined) continue
    tables[t.code] = toTable(t.code, text, `${t.file}.csv`)
  }
  return {
    meta: { kind: 'sample', hasMetaInf: true, hasReportJson: true, strayFiles: [], badEncoding: [], ...meta },
    tables,
  }
}
