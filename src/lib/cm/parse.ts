// CM Optimiser — enrichment layer.
//
// Turning a customer's part list into comparable physical features is the part
// that actually breaks in practice. The algorithm is the easy half; a column
// called "MATL" holding "AL 7075 T6 PER QQ-A-225" and a size column reading
// 'Ø1.575" x 4.72"' is the hard half.
//
// Everything here runs locally. No upload, no API call, no LLM — because the
// moment a part list leaves the browser, the aerospace shops this is built for
// stop being able to use it at all.

import { AlloyTable, parseDimensions, shapeFor, stockVolumeCm3 } from './catalogue'
import type { EnrichedRow, EnrichmentFlag, Part, RawRow } from './types'

// ------------------------------------------------------------------- CSV ----

/** A CSV reader that understands quoted fields, embedded commas and newlines,
 *  doubled quotes, semicolon and tab delimiters, and a UTF-8 BOM. Excel on a
 *  German or Dutch machine writes semicolons; pretending otherwise loses rows. */
export function parseDelimited(text: string): RawRow[] {
  let s = text.replace(/^﻿/, '')
  const sample = s.slice(0, 5000)
  const counts: [string, number][] = [
    [',', (sample.match(/,/g) || []).length],
    [';', (sample.match(/;/g) || []).length],
    ['\t', (sample.match(/\t/g) || []).length],
  ]
  const delim = counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ','

  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let quoted = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) {
      row.push(field)
      field = ''
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (ch !== '\r') field += ch
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim())
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => {
      const o: RawRow = {}
      headers.forEach((h, i) => (o[h] = (r[i] ?? '').trim()))
      return o
    })
}

// -------------------------------------------------------- column matching ---

/** Header synonyms, in the words people's ERPs actually use. Order matters:
 *  the first pattern to match a column wins it. */
const COLUMN_SYNONYMS: [keyof Part | 'description' | 'dimensions' | 'diameter', RegExp][] = [
  ['publicId', /^(part\s*(id|no|num(ber)?|#)?|item(\s*no)?|drawing|dwg|ref(erence)?|id)$/i],
  ['description', /desc|nomenclature|part\s*name|title/i],
  ['grade', /mat(erial|l)?|grade|alloy|spec(ification)?|stock\s*type/i],
  ['dimensions', /dimension|envelope|^size|overall|bounding|blank\s*size|stock\s*size/i],
  ['diameter', /\b(dia(meter)?|o\.?d\.?|outer\s*dia)\b/i],
  ['envL', /\b(length|len|long|l\b|env.*l)\b/i],
  ['envW', /\b(width|wide|w\b|across)\b/i],
  ['envH', /\b(height|thick(ness)?|thk|depth|h\b)\b/i],
  ['partMassKg', /\b(part\s*)?(mass|weight|wt)\b|kg\b/i],
  ['stockMassKg', /\b(stock|billet|blank|raw)\s*(mass|weight|wt)\b/i],
  ['tightestTolMm', /tol(erance)?|true\s*position|gd&?t/i],
  ['surfaceRaUm', /\bra\b|roughness|surface\s*finish/i],
  ['nFeatures', /features?|holes|ops\b|operations/i],
  ['nSetups', /set[\s-]?ups?|fixturings?/i],
  ['process', /process|machine|route|work\s*cent(re|er)/i],
  ['surfaceTreat', /coat(ing)?|plat(ing|e)|anodi[sz]|treatment|finish\b/i],
  ['heatTreat', /heat\s*treat|\bht\b|temper|condition/i],
  ['batchQty', /batch|lot|order\s*qty|release/i],
  ['annualQty', /annual|eau|yearly|volume|^qty|quantity/i],
  ['partFamily', /family|category|part\s*type|commodity/i],
  ['unitPriceEur', /price|cost|value|rate|eur|€|\bamount\b/i],
  ['quoteDate', /date|quoted\s*on|when/i],
]

export type ColumnMap = Partial<Record<string, string>>

/** Work out which column is which, once, from the headers. */
export function mapColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {}
  const taken = new Set<string>()
  for (const [field, pattern] of COLUMN_SYNONYMS) {
    for (const h of headers) {
      if (taken.has(h)) continue
      if (pattern.test(h.trim())) {
        map[field as string] = h
        taken.add(h)
        break
      }
    }
  }
  return map
}

// ------------------------------------------------------------- enrichment ---

const num = (v: string | undefined): number | null => {
  if (v === undefined || v === null) return null
  const m = String(v).replace(/[^\d.,\-]/g, '').replace(',', '.')
  const n = parseFloat(m)
  return Number.isFinite(n) ? n : null
}

/** Sensible stand-ins for what an RFQ leaves out, each one flagged so the
 *  results table can show the visitor exactly what was assumed on their behalf. */
export const DEFAULTS = {
  nFeatures: 12,
  nSetups: 2,
  tightestTolMm: 0.05,
  surfaceRaUm: 3.2,
  surfaceTreat: 'none',
  heatTreat: 'none',
  batchQty: 100,
  annualQty: 1000,
  fillFactor: 0.45,
  partFamily: 'bracket',
}

export function enrichRow(
  raw: RawRow,
  map: ColumnMap,
  alloys: AlloyTable,
  index: number,
  mode: 'raw' | 'enriched' = 'enriched',
): EnrichedRow {
  const flags: EnrichmentFlag[] = []
  const mapped: Record<string, string> = {}
  const get = (f: string) => (map[f] ? raw[map[f]!] : undefined)
  for (const [f, col] of Object.entries(map)) if (col) mapped[f] = col

  // --- grade -------------------------------------------------------------
  const written = (get('grade') ?? '').trim()
  const description = (get('description') ?? '').trim()
  let grade = written
  let alloyFamily = ''
  if (mode === 'enriched') {
    const resolved = alloys.resolve(written) ?? (description ? alloys.resolve(description) : null)
    if (resolved) {
      if (resolved !== written) flags.push({ kind: 'grade-normalised', written, resolved })
      grade = resolved
      alloyFamily = alloys.get(resolved)!.family
    } else {
      flags.push({ kind: 'grade-unresolved', written: written || description || '(blank)' })
    }
  }

  // --- dimensions --------------------------------------------------------
  let dims: number[] | null = null
  const l = num(get('envL'))
  const w = num(get('envW'))
  const h = num(get('envH'))
  const dia = num(get('diameter'))
  if (l !== null && (w !== null || dia !== null)) {
    dims = [l, dia ?? w!, dia ?? h ?? w!]
  } else if (mode === 'enriched') {
    const cell = (get('dimensions') ?? '') || description
    const parsed = parseDimensions(cell)
    if (parsed) {
      dims = parsed.dims
      flags.push({ kind: 'dimensions-parsed', written: cell })
      if (parsed.converted) flags.push({ kind: 'units-converted', from: 'in', written: cell })
    }
  }
  if (!dims) flags.push({ kind: 'missing', field: 'dimensions' })

  // --- family and shape --------------------------------------------------
  const familyRaw = (get('partFamily') ?? '').trim().toLowerCase()
  const partFamily = familyRaw || guessFamily(description) || DEFAULTS.partFamily
  const shapeClass = shapeFor(partFamily)

  // --- mass --------------------------------------------------------------
  let partMassKg = num(get('partMassKg'))
  let stockMassKg = num(get('stockMassKg'))
  const alloy = alloyFamily ? alloys.get(grade) : undefined
  if (dims && alloy && mode === 'enriched') {
    const vol = stockVolumeCm3(shapeClass, dims[0], dims[1], dims[2])
    if (stockMassKg === null) stockMassKg = (vol * alloy.density) / 1000
    if (partMassKg === null) {
      partMassKg = stockMassKg * DEFAULTS.fillFactor
      flags.push({ kind: 'mass-derived' })
    }
  }

  const annualQty = num(get('annualQty')) ?? DEFAULTS.annualQty
  const batchQty = num(get('batchQty')) ?? Math.max(1, Math.round(annualQty * 0.25))

  const part: Partial<Part> = {
    publicId: (get('publicId') ?? `row-${index + 1}`).trim() || `row-${index + 1}`,
    partFamily,
    shapeClass,
    grade,
    alloyFamily,
    process: (get('process') ?? '').trim() || defaultProcess(shapeClass),
    envL: dims?.[0],
    envW: dims?.[1],
    envH: dims?.[2],
    stockMassKg: stockMassKg ?? undefined,
    partMassKg: partMassKg ?? undefined,
    nFeatures: num(get('nFeatures')) ?? DEFAULTS.nFeatures,
    nSetups: num(get('nSetups')) ?? DEFAULTS.nSetups,
    tightestTolMm: num(get('tightestTolMm')) ?? DEFAULTS.tightestTolMm,
    surfaceRaUm: num(get('surfaceRaUm')) ?? DEFAULTS.surfaceRaUm,
    heatTreat: (get('heatTreat') ?? '').trim() || DEFAULTS.heatTreat,
    surfaceTreat: (get('surfaceTreat') ?? '').trim() || DEFAULTS.surfaceTreat,
    annualQty,
    batchQty,
    quoteDate: (get('quoteDate') ?? '').trim() || new Date().toISOString().slice(0, 10),
    unitPriceEur: num(get('unitPriceEur')) ?? 0,
    won: false,
  }

  for (const f of ['nFeatures', 'nSetups', 'tightestTolMm', 'surfaceRaUm'] as const) {
    if (!map[f]) flags.push({ kind: 'missing', field: f })
  }

  const usable = Boolean(dims) && (mode === 'raw' || Boolean(alloyFamily))
  return { part, mapped, flags, usable }
}

const FAMILY_WORDS: [string, RegExp][] = [
  ['shaft', /shaft|spindle|axle|rod\b/i],
  ['bushing', /bush(ing)?|sleeve|liner/i],
  ['pin', /\bpin\b|dowel|stud/i],
  ['gear blank', /gear|pinion|sprocket/i],
  ['fitting', /fitting|union|nipple|coupling|adapt[oe]r/i],
  ['flange', /flange|collar/i],
  ['bracket', /bracket|mount|support|clip|lug/i],
  ['housing', /housing|casing|enclosure|body|cover/i],
  ['plate', /plate|panel|shim|disc|disk/i],
  ['manifold', /manifold|valve\s*block|block\b/i],
]

function guessFamily(text: string): string | null {
  for (const [family, re] of FAMILY_WORDS) if (re.test(text)) return family
  return null
}

function defaultProcess(shape: Part['shapeClass']) {
  return shape === 'rotational' ? 'turning' : '3-axis mill'
}

/** Turn whatever arrived into parts the engine can take, keeping the rows it
 *  could not use so the page can say how many and why. */
export function enrichAll(
  rows: RawRow[],
  alloys: AlloyTable,
  mode: 'raw' | 'enriched' = 'enriched',
) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []
  const map = mapColumns(headers)
  const enriched = rows.map((r, i) => enrichRow(r, map, alloys, i, mode))
  return {
    map,
    headers,
    rows: enriched,
    usable: enriched.filter((r) => r.usable).length,
    unusable: enriched.filter((r) => !r.usable).length,
  }
}

/** Read an .xlsx the way a shop would hand it over. Loaded on demand so the
 *  1 MB of spreadsheet parser never touches anyone who only uploads a CSV. */
export async function readSpreadsheet(file: File): Promise<RawRow[]> {
  if (/\.(csv|tsv|txt)$/i.test(file.name)) return parseDelimited(await file.text())

  // .xls is the pre-2007 binary format and is not a zip archive at all, so no
  // amount of xlsx parsing will open it. Say so instead of failing obscurely.
  if (/\.xls$/i.test(file.name)) {
    throw new Error(
      'This is the old .xls format. Open it in Excel and use Save As → .xlsx, or export it as CSV.',
    )
  }

  const { default: readXlsxFile } = await import('read-excel-file/browser')
  const matrix = toMatrix(await readXlsxFile(file))
  if (matrix.length < 2) return []
  const headers = matrix[0].map((h, i) => String(h ?? '').trim() || `Column ${i + 1}`)
  return matrix.slice(1).map((r) => {
    const o: RawRow = {}
    headers.forEach((h, i) => (o[h] = cellToString(r[i])))
    return o
  })
}

/** read-excel-file does not always hand back a plain row matrix — depending on
 *  the workbook it returns `[{ sheet, data }]`, one entry per sheet. Reading
 *  that as rows makes every Excel file look like a single-row file, which is
 *  how an upload could report "no rows found" on a perfectly good spreadsheet.
 *  Accept either shape, and when there are several sheets take the first one
 *  with actual data rather than assuming it is first in the file. */
function toMatrix(result: unknown): unknown[][] {
  if (!Array.isArray(result)) return []
  const sheets = result.filter(
    (s): s is { data: unknown[][] } =>
      Boolean(s) && typeof s === 'object' && Array.isArray((s as { data?: unknown }).data),
  )
  if (sheets.length > 0) {
    const used = sheets.map((s) => s.data).filter((d) => d.length >= 2)
    return used[0] ?? sheets[0].data ?? []
  }
  return result as unknown[][]
}

/** Excel hands dates back as Date objects and numbers as numbers. Stringifying
 *  a Date naively yields "Tue Jan 14 2026 00:00:00 GMT+0100 (…)", which then
 *  gets profiled as a mixed-format text column — an artefact of the reader, not
 *  of the customer's data. */
function cellToString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) {
    const iso = new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString()
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso.slice(0, 19).replace('T', ' ')
  }
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return String(v).trim()
}
