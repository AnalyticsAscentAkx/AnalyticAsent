// RFC 4180 CSV, which is the only dialect the EBA accepts for these files.
//
// Deliberately not the delimiter-sniffing parser the Data Clinic uses: a
// semicolon-separated register is a rejected register, and the right response
// is to say so rather than to quietly read it. Quoting, doubled quotes and
// newlines inside quotes are handled; a UTF-8 BOM is tolerated because the EBA
// has accepted one since May 2025.

export interface Parsed {
  header: string[]
  rows: string[][]
  /** 1-based data row numbers whose cell count differs from the header. */
  ragged: number[]
  /** True when the header looks like one field containing semicolons. */
  semicolons: boolean
}

export function parseCsv(text: string): Parsed {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  const records: string[][] = []
  let field = ''
  let row: string[] = []
  let quoted = false
  let i = 0
  const n = text.length
  while (i < n) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }
    if (ch === '"') {
      quoted = true
      i++
      continue
    }
    if (ch === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (ch === '\r') {
      i++
      continue
    }
    if (ch === '\n') {
      row.push(field)
      records.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += ch
    i++
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    records.push(row)
  }
  // A trailing empty line is not a row.
  while (records.length && records[records.length - 1].every((c) => c === '')) records.pop()
  if (records.length === 0) return { header: [], rows: [], ragged: [], semicolons: false }
  const header = records[0].map((h) => h.trim())
  const rows = records.slice(1)
  const ragged: number[] = []
  rows.forEach((r, idx) => {
    if (r.length !== header.length) ragged.push(idx + 1)
  })
  const semicolons = header.length === 1 && header[0].includes(';')
  return { header, rows, ragged, semicolons }
}

export function csvEscape(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n') + '\n'
}
