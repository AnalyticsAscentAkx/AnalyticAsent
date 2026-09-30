// Data clinic — find what is wrong with a spreadsheet.
//
// The pitch on this site is "bring the messy version". This is that claim made
// checkable: drop in a real export and it names the problems rather than
// asserting they can be handled. Every check here came from something that
// actually cost someone time on a real engagement.
//
// Runs entirely in the browser. Nothing is uploaded.

export type ColumnType =
  | 'number'
  | 'integer'
  | 'date'
  | 'boolean'
  | 'category'
  | 'text'
  | 'empty'

export interface Issue {
  kind: string
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
  column?: string
  count: number
  examples: string[]
}

export interface ColumnProfile {
  name: string
  type: ColumnType
  filled: number
  missing: number
  distinct: number
  examples: string[]
  numbers?: number[]
  min?: number
  max?: number
}

export interface Profile {
  rows: number
  columns: ColumnProfile[]
  issues: Issue[]
  duplicateRows: number
}

const ROW_KEY_SEP = String.fromCharCode(1)

const MISSING = new Set([
  '', 'na', 'n/a', 'nan', 'null', 'none', 'nil', '-', '--', '#n/a', '#value!',
  '#ref!', 'tbc', 'tbd', 'unknown', '?', 'x',
])

const isMissing = (v: string) => MISSING.has(v.trim().toLowerCase())

const CURRENCY_RE = /[€$£¥]/g
const PERCENT_RE = /%$/
const UNIT_RE = /\b(kg|g|t|mm|cm|m|km|in|inch|ft|lb|lbs|pcs|eur|usd|gbp)\b/i
const INCH_MARK = /["”]/
const DATE_SLASH = /^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/
const DATE_ISO = /^\d{4}-\d{2}-\d{2}/
const BOOL = new Set(['true', 'false', 'yes', 'no', 'y', 'n', '1', '0'])

/** Reads a number the way a person would, not the way parseFloat does:
 *  currency symbols, trailing units, and both decimal conventions. */
function parseNumberish(v: string): number | null {
  let s = v.replace(CURRENCY_RE, '').replace(PERCENT_RE, '').replace(UNIT_RE, '').trim()
  s = s.replace(/\s/g, '')
  if (!s || !/\d/.test(s)) return null

  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // whichever comes last is the decimal separator
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (lastComma > -1) {
    // a lone comma is decimal only when one or two digits follow it
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function classify(values: string[]): ColumnType {
  const present = values.filter((v) => !isMissing(v))
  if (present.length === 0) return 'empty'
  const n = present.length
  const numeric = present.filter((v) => parseNumberish(v) !== null).length
  const dated = present.filter((v) => DATE_ISO.test(v) || DATE_SLASH.test(v)).length
  const bools = present.filter((v) => BOOL.has(v.trim().toLowerCase())).length

  if (dated / n > 0.8) return 'date'
  if (bools / n > 0.9) return 'boolean'
  if (numeric / n > 0.85) {
    const allInt = present.every((v) => {
      const x = parseNumberish(v)
      return x !== null && Number.isInteger(x)
    })
    return allInt ? 'integer' : 'number'
  }
  const distinct = new Set(present.map((v) => v.trim().toLowerCase())).size
  if (distinct <= Math.max(12, n * 0.05)) return 'category'
  return 'text'
}

/** Values differing only by case, spacing or punctuation are almost always the
 *  same thing typed twice. This is the commonest reason a join quietly drops
 *  rows and a total comes out short. */
function nearDuplicates(values: string[]) {
  const groups = new Map<string, Set<string>>()
  for (const v of values) {
    if (isMissing(v)) continue
    const key = v.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!key) continue
    if (!groups.has(key)) groups.set(key, new Set())
    groups.get(key)!.add(v.trim())
  }
  return [...groups.values()].filter((s) => s.size > 1)
}

export function profile(rows: Record<string, string>[]): Profile {
  const issues: Issue[] = []
  const names = rows.length > 0 ? Object.keys(rows[0]) : []
  const columns: ColumnProfile[] = []

  // ------------------------------------------------ whole-table checks ---
  const seen = new Map<string, number>()
  for (const r of rows) {
    const key = names.map((n) => (r[n] ?? '').trim().toLowerCase()).join(ROW_KEY_SEP)
    seen.set(key, (seen.get(key) ?? 0) + 1)
  }
  const duplicateRows = [...seen.values()]
    .filter((c) => c > 1)
    .reduce((a, c) => a + c - 1, 0)

  if (duplicateRows > 0) {
    issues.push({
      kind: 'duplicate-rows',
      severity: 'high',
      title: `${duplicateRows.toLocaleString('en-GB')} duplicate row${duplicateRows === 1 ? '' : 's'}`,
      detail:
        'Identical once case and surrounding spaces are ignored. Anything totalled from this file currently counts them more than once.',
      count: duplicateRows,
      examples: [],
    })
  }

  const blankHeaders = names.filter((n) => !n.trim()).length
  if (blankHeaders > 0) {
    issues.push({
      kind: 'blank-header',
      severity: 'medium',
      title: `${blankHeaders} column${blankHeaders === 1 ? '' : 's'} with no header`,
      detail:
        'Unnamed columns usually mean the real header row is further down the sheet, under a title or a logo.',
      count: blankHeaders,
      examples: [],
    })
  }

  const dupeHeaders = names.filter((n, i) => names.indexOf(n) !== i)
  if (dupeHeaders.length > 0) {
    issues.push({
      kind: 'duplicate-header',
      severity: 'medium',
      title: 'Repeated column names',
      detail: 'Two columns share a name, so one of them cannot be reached by name at all.',
      count: dupeHeaders.length,
      examples: [...new Set(dupeHeaders)].slice(0, 4),
    })
  }

  // ------------------------------------------------- per-column checks ---
  for (const name of names) {
    const values = rows.map((r) => r[name] ?? '')
    const present = values.filter((v) => !isMissing(v))
    const type = classify(values)

    const col: ColumnProfile = {
      name,
      type,
      filled: present.length,
      missing: values.length - present.length,
      distinct: new Set(present.map((v) => v.trim())).size,
      examples: [...new Set(present.map((v) => v.trim()))].slice(0, 3),
    }

    if (type === 'number' || type === 'integer') {
      const nums = present
        .map(parseNumberish)
        .filter((x): x is number => x !== null)
      if (nums.length > 0) {
        col.numbers = nums
        col.min = Math.min(...nums)
        col.max = Math.max(...nums)
      }
    }
    columns.push(col)

    const share = col.missing / Math.max(values.length, 1)
    if (col.missing > 0 && share > 0.05) {
      issues.push({
        kind: 'missing',
        severity: share > 0.4 ? 'high' : 'low',
        title: `${name} is ${Math.round(share * 100)}% empty`,
        detail:
          'Blanks and placeholders such as N/A, TBC and "-" counted together. Decide whether these mean zero or unknown before anything averages them.',
        column: name,
        count: col.missing,
        examples: [],
      })
    }

    if (type === 'text' || type === 'category') {
      const numeric = present.filter((v) => parseNumberish(v) !== null).length
      const ratio = present.length > 0 ? numeric / present.length : 0
      if (ratio > 0.6 && ratio < 0.99) {
        issues.push({
          kind: 'mixed-number-text',
          severity: 'high',
          title: `${name} mixes numbers and text`,
          detail: `${numeric} of ${present.length} values read as numbers and the rest do not. A spreadsheet sorts this column alphabetically, so 100 comes before 20.`,
          column: name,
          count: present.length - numeric,
          examples: present.filter((v) => parseNumberish(v) === null).slice(0, 3),
        })
      }
    }

    const withUnits = present.filter((v) => UNIT_RE.test(v) || INCH_MARK.test(v))
    if (withUnits.length > 0 && withUnits.length <= present.length) {
      const units = new Set(
        withUnits.map((v) =>
          INCH_MARK.test(v) ? 'in' : (v.match(UNIT_RE)?.[0] ?? '').toLowerCase(),
        ),
      )
      if (units.size > 1 || withUnits.length !== present.length) {
        issues.push({
          kind: 'mixed-units',
          severity: 'high',
          title: `${name} carries units inside the values`,
          detail:
            units.size > 1
              ? `More than one unit appears in the same column (${[...units].join(', ')}), so the bare numbers are not comparable.`
              : 'Some values carry a unit and some do not, so the bare numbers mean different things.',
          column: name,
          count: withUnits.length,
          examples: withUnits.slice(0, 3),
        })
      }
    }

    const euro = present.filter((v) => /^\s*-?\d{1,3}(\.\d{3})*,\d+\s*$/.test(v)).length
    const anglo = present.filter((v) => /^\s*-?\d{1,3}(,\d{3})*\.\d+\s*$/.test(v)).length
    if (euro > 0 && anglo > 0) {
      issues.push({
        kind: 'decimal-separator',
        severity: 'high',
        title: `${name} mixes decimal separators`,
        detail: `${euro} values use a comma and ${anglo} use a full stop. Read carelessly, 1,234 becomes either 1.234 or 1234 — a factor of a thousand.`,
        column: name,
        count: euro + anglo,
        examples: present.filter((v) => /,\d+$/.test(v)).slice(0, 2),
      })
    }

    if (type === 'date' || present.some((v) => DATE_SLASH.test(v))) {
      const iso = present.filter((v) => DATE_ISO.test(v)).length
      const slash = present.filter((v) => DATE_SLASH.test(v)).length
      if (iso > 0 && slash > 0) {
        issues.push({
          kind: 'mixed-dates',
          severity: 'medium',
          title: `${name} mixes date formats`,
          detail: `${iso} ISO dates and ${slash} written in day/month order. Where the day is 12 or lower the two are indistinguishable, so some are silently wrong.`,
          column: name,
          count: iso + slash,
          examples: present.filter((v) => DATE_SLASH.test(v)).slice(0, 3),
        })
      }
    }

    const near = nearDuplicates(present)
    if (near.length > 0 && (type === 'category' || type === 'text')) {
      issues.push({
        kind: 'inconsistent-values',
        severity: 'medium',
        title: `${name} spells the same value more than one way`,
        detail:
          'These differ only by case, spacing or punctuation. Any group-by or join treats them as separate things, which is how totals quietly go missing.',
        column: name,
        count: near.length,
        examples: near.slice(0, 2).map((s) => [...s].join('   vs   ')),
      })
    }

    const padded = present.filter((v) => v !== v.trim()).length
    if (padded > 0) {
      issues.push({
        kind: 'whitespace',
        severity: 'low',
        title: `${name} has ${padded} value${padded === 1 ? '' : 's'} with stray spaces`,
        detail: 'Invisible on screen, and enough to break an exact match or a lookup.',
        column: name,
        count: padded,
        examples: [],
      })
    }
  }

  const order = { high: 0, medium: 1, low: 2 }
  issues.sort((a, b) => order[a.severity] - order[b.severity] || b.count - a.count)

  return { rows: rows.length, columns, issues, duplicateRows }
}

/** The cleaned version: trimmed, de-duplicated, placeholders emptied, numbers
 *  normalised to one convention. Deliberately conservative — it never guesses
 *  a date order, because guessing wrong is worse than leaving it alone. */
export function clean(rows: Record<string, string>[], prof: Profile) {
  const names = prof.columns.map((c) => c.name)
  const numericCols = new Set(
    prof.columns
      .filter((c) => c.type === 'number' || c.type === 'integer')
      .map((c) => c.name),
  )
  const seen = new Set<string>()
  const out: Record<string, string>[] = []

  for (const r of rows) {
    const cleaned: Record<string, string> = {}
    for (const n of names) {
      let v = (r[n] ?? '').trim()
      if (isMissing(v)) {
        v = ''
      } else if (numericCols.has(n)) {
        const x = parseNumberish(v)
        if (x !== null) v = String(x)
      }
      cleaned[n] = v
    }
    const key = names.map((n) => cleaned[n].toLowerCase()).join(ROW_KEY_SEP)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
  }
  return out
}

export function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return ''
  const names = Object.keys(rows[0])
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return [
    names.join(','),
    ...rows.map((r) => names.map((n) => esc(r[n] ?? '')).join(',')),
  ].join('\n')
}

/** A deliberately awful sample, so the page has something to demonstrate on
 *  without anyone having to find a bad file first. Every defect in it is one
 *  the checks above look for. */
export const MESSY_SAMPLE = [
  'Part No,Material,Size,Qty,Unit Price,Order Date',
  'A-1001,AL 6061-T6,"120 x 60 x 20 mm",250,"€12,50",2026-01-14',
  'A-1002,al 6061 t6,"4.72"" x 2.36""",250,13.75,14/01/2026',
  'A-1003,AL6061T6 ,"120x60x20",N/A,"€12,50",2026-01-15',
  'A-1004,Ti-6Al-4V,"Ø40 x 120",1000,48.20,2026-02-01',
  'A-1005,TI6AL4V,"Ø40 x 120",1 000,"48,20",02/02/2026',
  'A-1004,Ti-6Al-4V,"Ø40 x 120",1000,48.20,2026-02-01',
  'A-1006,Stainless 316L,"200 x 80 x 15 mm",TBC,,2026-02-11',
  'A-1007,316L,"200 x 80 x 15",500,"1.234,00",11/02/2026',
  'A-1008,  316L  ,"7.87"" x 3.15""",500,1234.00,2026-02-12',
].join('\n')
