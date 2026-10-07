// The checks, in the order the EBA's receiving system applies them.
//
// Rule codes are the EBA's wherever the EBA has one — a visitor who has seen a
// feedback file will recognise 807, 805, v8850_m and VR_71 — so the output
// here can be read against the official feedback and the official rule list.
// Checks the EBA does not run carry an AA- prefix and say what they rest on:
// usually the ITS text, which asks for more than the DPM rules enforce.
//
// Sources: EBA "Overview of the RoI reporting technical checks and validation
// rules" (28 April 2025); EBA Filing Rules v5.5; the DORA 4.0 taxonomy
// package; ESAs RoI reporting FAQ (28 March 2025).

import {
  EEA,
  euidFormatOk,
  isPlaceholderCode,
  LEI_RE,
  leiChecksumOk,
  OPEN_ENDED,
  validIsoDate,
} from './reference'
import { DOMAINS, tableByCode, TABLES, V, type Table } from './schema'
import type { Finding, Register, TableData } from './types'

const ZIP_NAME_RE = /^([A-Z0-9]{20})\.(CON|IND)_([A-Z]{2})_DORA(\d{6})_DORA_(\d{4}-\d{2}-\d{2})_(\d{17})\.zip$/
const SEP = '|'

export function validate(reg: Register): Finding[] {
  const out: Finding[] = []
  checkPackage(reg, out)
  for (const t of TABLES) {
    const data = reg.tables[t.code]
    if (!data) continue
    checkStructure(t, data, out)
  }
  checkKeys(reg, out)
  checkValues(reg, out)
  checkBusiness(reg, out)
  checkIdentifiers(reg, out)
  checkConsistency(reg, out)
  return out
}

// --- helpers ----------------------------------------------------------------

export function idx(data: TableData): Record<string, number> {
  const m: Record<string, number> = {}
  data.header.forEach((h, i) => (m[h] = i))
  return m
}

export const get = (row: string[], i: number | undefined) => (i === undefined ? '' : (row[i] ?? '').trim())

function rowHasContent(row: string[], except: number): boolean {
  return row.some((v, i) => i !== except && (v ?? '').trim() !== '')
}

function push(out: Finding[], f: Finding) {
  out.push(f)
}

// --- package ----------------------------------------------------------------

function checkPackage(reg: Register, out: Finding[]) {
  const m = reg.meta
  const pkg = (rule: string, severity: Finding['severity'], message: string, value?: string) =>
    push(out, { rule, layer: 'package', severity, template: 'package', message, value })

  if (m.kind === 'zip' && m.zipName) {
    if (!/^[A-Za-z0-9_.-]+$/.test(m.zipName)) {
      pkg('104', 'reject', 'The file name may only contain letters, digits, hyphen, underscore and full stop.', m.zipName)
    }
    const nm = m.zipName.match(ZIP_NAME_RE)
    if (!nm) {
      pkg(
        '105',
        'reject',
        'The zip must be named <LEI>.<CON|IND>_<CC>_DORA010100_DORA_<yyyy-mm-dd>_<yyyyMMddHHmmssSSS>.zip.',
        m.zipName,
      )
    } else {
      const [, lei, scope, , module, refDate] = nm
      if (module !== '010100') {
        pkg('106', 'reject', `Module version DORA${module} is not the DORA module in force (DORA010100). DORA010000 was the 2024 dry run.`, `DORA${module}`)
      }
      if (!validIsoDate(refDate)) pkg('109', 'reject', 'The reference date in the file name is not a valid date.', refDate)
      else if (new Date(refDate) > new Date()) pkg('111', 'reject', 'The reference date in the file name is in the future.', refDate)
      if (!leiChecksumOk(lei)) pkg('AA-01', 'warning', 'The LEI in the file name does not pass the ISO 17442 check digits.', lei)
      const subject = `rs:${lei}.${scope}`
      const entity = m.parameters?.entityID
      if (entity !== undefined && entity !== subject) {
        pkg('714', 'reject', `entityID in parameters.csv must equal ${subject}.`, entity)
      }
      const ref = m.parameters?.refPeriod
      if (ref !== undefined && ref !== refDate) {
        pkg('320', 'reject', `refPeriod in parameters.csv (${ref}) must equal the reference date in the file name (${refDate}).`, ref)
      }
      const stem = m.zipName.replace(/\.zip$/i, '')
      if (m.root && m.root !== stem) {
        pkg('103', 'reject', 'The root folder inside the zip must have the same name as the zip without .zip.', m.root)
      }
      if (!m.root) pkg('103', 'reject', 'The zip must contain one root folder, named like the zip, holding META-INF and reports.')
    }
    if (!m.hasMetaInf) pkg('103', 'reject', 'META-INF/reportPackage.json is missing.')
    if (!m.hasReportJson) pkg('701', 'reject', 'reports/report.json is missing or empty.')
    else if (m.reportJsonExtends && !/fws\/dora\/4\.0\/mod\/dora\.json$/.test(m.reportJsonExtends)) {
      pkg('505', 'reject', 'report.json must extend the DORA 4.0 module entry point (…/fws/dora/4.0/mod/dora.json).', m.reportJsonExtends)
    }
    if (!m.parameters) pkg('701', 'reject', 'reports/parameters.csv is missing or empty.')
    else {
      if (!m.parametersHeader || m.parametersHeader[0] !== 'name' || m.parametersHeader[1] !== 'value') {
        pkg('723', 'reject', 'parameters.csv must start with the header "name,value", in that order.', m.parametersHeader?.join(','))
      }
      if (!m.parameters.entityID) pkg('714', 'reject', 'parameters.csv has no entityID.')
      else if (!/\.(CON|IND)$/.test(m.parameters.entityID)) {
        pkg('514', 'reject', 'entityID must end in .CON (consolidated) or .IND (individual).', m.parameters.entityID)
      }
      if (!m.parameters.refPeriod) pkg('320', 'reject', 'parameters.csv has no refPeriod.')
      else if (!validIsoDate(m.parameters.refPeriod)) pkg('330', 'reject', 'refPeriod must be a date in yyyy-mm-dd form.', m.parameters.refPeriod)
    }
    if (!m.filingIndicators) pkg('701', 'reject', 'reports/FilingIndicators.csv is missing or empty.')
    else {
      const h = (m.filingHeader ?? []).map((x) => x.toLowerCase())
      if (!(h.includes('templateid') && h.includes('reported') && h.length === 2)) {
        pkg('702', 'reject', 'FilingIndicators.csv must have exactly the header "templateID,reported".', m.filingHeader?.join(','))
      }
      const seen = new Set<string>()
      for (const [tpl, val] of Object.entries(m.filingIndicators)) {
        if (!tableByCode(tpl)) pkg('510', 'reject', `${tpl} is not a DORA template code. Codes are upper-case, e.g. B_01.01.`, tpl)
        if (seen.has(tpl)) pkg('703', 'reject', `${tpl} is declared more than once in FilingIndicators.csv.`, tpl)
        seen.add(tpl)
        if (!['true', 'false', '1', '0'].includes(val.toLowerCase())) pkg('704', 'reject', `Filing indicator for ${tpl} must be true/false or 1/0.`, val)
        else if (!['true', '1'].includes(val.toLowerCase())) {
          pkg('808', 'reject', `Every template must be declared true; a template with nothing to report is sent as an empty file, not as false (${tpl}).`, val)
        }
      }
      for (const t of TABLES) {
        if (!(t.code in m.filingIndicators)) pkg('705', 'reject', `${t.code} has no filing indicator.`, t.code)
      }
    }
  }
  for (const s of m.strayFiles) {
    pkg('720', 'reject', 'Only the fifteen lower-case table files (b_01.01.csv …) and the three metadata files may be in reports/.', s)
  }
  for (const s of m.badEncoding) pkg('306', 'reject', 'Every file must be UTF-8.', s)
  if (m.kind === 'zip' && Object.values(reg.tables).every((t) => t.rows.length === 0)) {
    pkg('724', 'reject', 'No table contains any data; the package would be rejected as empty.')
  }
  for (const code of ['B_01.01', 'B_01.02', 'B_02.01', 'B_02.02', 'B_05.01', 'B_06.01']) {
    const t = reg.tables[code]
    if (!t || t.rows.length === 0) {
      push(out, {
        rule: 'AA-EMPTY',
        layer: 'package',
        severity: 'warning',
        template: code,
        message: `${code} is ${t ? 'empty' : 'missing'}. A template can be delivered empty, but the FAQ says B_01.02 "cannot be left empty in any scenario", and a register with no contracts or providers is not one the supervisor will accept as complete.`,
      })
    }
  }
}

// --- structure --------------------------------------------------------------

function checkStructure(t: Table, data: TableData, out: Finding[]) {
  const st = (rule: string, message: string, extra: Partial<Finding> = {}) =>
    push(out, { rule, layer: 'structure', severity: 'reject', template: t.code, message, ...extra })

  if (data.semicolons) {
    st('809', 'The file is semicolon-separated. The EBA reads comma-separated CSV only; this reads as one column.', { value: data.header[0] })
    return
  }
  const known = new Set(t.columns.map((c) => c.code))
  const seen = new Set<string>()
  data.header.forEach((h, i) => {
    if (h === '') st('801', `Header cell ${i + 1} is empty (a trailing comma, or a blank column).`, { column: `col ${i + 1}` })
    else if (!known.has(h)) st('801', `${h} is not a column of ${t.code}. Codes are lower-case cXXXX; the valid ones are ${t.columns.map((c) => c.code).join(', ')}.`, { column: h, value: h })
    if (h && seen.has(h)) st('802', `${h} appears twice in the header.`, { column: h })
    seen.add(h)
  })
  for (const r of data.ragged.slice(0, 50)) {
    st('809', `Row ${r} has a different number of cells from the header (an unquoted comma, or a missing field).`, { row: r })
  }
  if (data.ragged.length > 50) st('809', `… and ${data.ragged.length - 50} more rows with the wrong cell count.`)
  if (data.source.includes('case differs')) {
    st('720', 'Table file names must be lower-case (b_02.02.csv, not B_02.02.csv).', { value: data.source })
  }
}

// --- keys -------------------------------------------------------------------

function keyTuple(row: string[], cols: string[], ix: Record<string, number>): string | null {
  const parts: string[] = []
  for (const c of cols) {
    const v = get(row, ix[c])
    if (v === '') return null
    parts.push(v)
  }
  return parts.join(SEP)
}

function checkKeys(reg: Register, out: Finding[]) {
  // Primary keys first, so that the sets exist for the foreign-key pass.
  const keySets: Record<string, Set<string>> = {}
  for (const t of TABLES) {
    const data = reg.tables[t.code]
    if (!data || t.primary.length === 0) continue
    const ix = idx(data)
    const set = new Set<string>()
    data.rows.forEach((row, r) => {
      if (!rowHasContent(row, -1)) return
      for (const c of t.primary) {
        if (ix[c] === undefined || get(row, ix[c]) === '') {
          push(out, {
            rule: '805',
            layer: 'keys',
            severity: 'reject',
            template: t.code,
            row: r + 1,
            column: c,
            message: `${c} is a key column of ${t.code} and cannot be empty. ${placeholderHint(t.code, c)}`.trim(),
          })
        }
      }
      const k = keyTuple(row, t.primary, ix)
      if (k === null) return
      if (set.has(k)) {
        push(out, {
          rule: '806',
          layer: 'keys',
          severity: 'reject',
          template: t.code,
          row: r + 1,
          column: t.primary.join('+'),
          message: `Duplicate key (${t.primary.join(', ')}) — the same row exists earlier in ${t.code}.`,
          value: k.split(SEP).join(' | '),
        })
      }
      set.add(k)
    })
    keySets[t.code] = set
  }
  // Foreign keys, as the taxonomy declares them.
  for (const t of TABLES) {
    const data = reg.tables[t.code]
    if (!data) continue
    const ix = idx(data)
    for (const ref of t.references) {
      const target = tableByCode(ref.table)
      if (!target) continue
      const targetSet = keySets[ref.table]
      const targetData = reg.tables[ref.table]
      const rname = ref.name.split(' ')[0]
      data.rows.forEach((row, r) => {
        if (!rowHasContent(row, -1)) return
        const k = keyTuple(row, ref.columns, ix)
        if (k === null) return
        // The FAQ tells filers to type this literal when there is no overarching
        // arrangement. It is not a key in B_02.01, so the EBA engine may still
        // reject it; say so once rather than once per row.
        if (t.code === 'B_02.01' && ref.columns[0] === 'c0030' && /^not applicable$/i.test(k)) return
        if (!targetData) {
          push(out, {
            rule: '807',
            layer: 'keys',
            severity: 'reject',
            template: t.code,
            row: r + 1,
            column: ref.columns.join('+'),
            message: `${rname}: ${ref.columns.join(', ')} must exist in ${ref.table}, which is missing from the package.`,
            value: k.split(SEP).join(' | '),
          })
          return
        }
        if (!targetSet?.has(k)) {
          push(out, {
            rule: '807',
            layer: 'keys',
            severity: 'reject',
            template: t.code,
            row: r + 1,
            column: ref.columns.join('+'),
            message: `${rname}: (${ref.columns.join(', ')}) has no matching (${target.primary.join(', ')}) row in ${ref.table}. ${fkHint(t.code, ref.table)}`.trim(),
            value: k.split(SEP).join(' | '),
          })
        }
      })
    }
  }
  const b0201 = reg.tables['B_02.01']
  if (b0201) {
    const ix = idx(b0201)
    const n = b0201.rows.filter((r) => /^not applicable$/i.test(get(r, ix['c0030']))).length
    if (n > 0) {
      push(out, {
        rule: 'AA-NA',
        layer: 'keys',
        severity: 'insight',
        template: 'B_02.01',
        column: 'c0030',
        message: `${n} row(s) carry the literal "Not applicable" in c0030, as the ESAs' FAQ (Q124) suggests. It is not a contract reference, so an engine applying rule 807 strictly may reject it; leaving the cell empty is the safer reading of the ITS.`,
      })
    }
  }
}

function placeholderHint(table: string, col: string): string {
  if (table === 'B_02.02' && ['c0130', 'c0150', 'c0160'].includes(col)) return 'Use eba_GA:qx2007 (Not applicable) when the field does not apply.'
  if (table === 'B_04.01' && col === 'c0040') return 'For an entity that is not a branch, the FAQ says to type "Not Applicable".'
  if (table === 'B_05.02' && col === 'c0060') return 'For rank 1, repeat the provider code from c0030.'
  return ''
}

function fkHint(from: string, to: string): string {
  if (from === 'B_05.01' && to === 'B_05.01') return 'Every ultimate parent must have its own row in B_05.01 — the single most common cause of rejection in 2025.'
  if (from === 'B_02.02' && to === 'B_06.01') return 'The function identifier must be defined in B_06.01 for the same entity LEI.'
  if (from === 'B_02.02' && to === 'B_03.02') return 'Each contract/provider pair used in B_02.02 needs a signing row in B_03.02.'
  if (to === 'B_02.01') return 'Every contract reference used anywhere must be a row in B_02.01.'
  if (to === 'B_01.02') return 'Every LEI used as an entity must be listed in B_01.02.'
  return ''
}

// --- values -----------------------------------------------------------------

const INT_RE = /^-?\d+$/
const NUM_RE = /^-?\d+(\.\d+)?$/

function checkValues(reg: Register, out: Finding[]) {
  for (const t of TABLES) {
    const data = reg.tables[t.code]
    if (!data) continue
    const ix = idx(data)
    for (const c of t.columns) {
      const i = ix[c.code]
      if (i === undefined) continue
      const dom = c.domain ? DOMAINS[c.domain] : undefined
      data.rows.forEach((row, r) => {
        const v = get(row, i)
        if (v === '') return
        const val = (rule: string, message: string) =>
          push(out, { rule, layer: 'values', severity: 'reject', template: t.code, row: r + 1, column: c.code, message, value: v })
        switch (c.type) {
          case 'd':
            if (!validIsoDate(v)) val('330', `Dates must be yyyy-mm-dd${/^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(v) ? ' — this looks like a day-first or US-ordered date' : ''}.`)
            break
          case 'i':
            if (!INT_RE.test(v)) val('331', NUM_RE.test(v) ? 'This column is an integer; decimals are not accepted.' : 'This column is an integer.')
            break
          case 'm':
            if (!NUM_RE.test(v)) {
              val('305', /^-?[\d.]+,\d+$/.test(v) || /^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(v) ? 'Amounts use a full stop as the decimal separator and no thousands separator.' : /[€$£a-zA-Z]/.test(v) ? 'Amounts are plain numbers in units, without currency symbols or text.' : 'This column is a monetary amount.')
            }
            break
          case 't':
            if (!['true', '1'].includes(v.toLowerCase())) val('333', ['false', '0'].includes(v.toLowerCase()) ? 'Link columns must be true (or 1); a false row should simply not exist.' : 'Link columns must be true (or 1).')
            break
          case 'e':
            if (dom && !(v in dom)) {
              const bare = v.replace(/^eba_[A-Za-z]+:/, '')
              const withPrefix = Object.keys(dom).find((k) => k.split(':')[1] === bare || k.split(':')[1].toUpperCase() === bare.toUpperCase())
              const byLabel = Object.entries(dom).find(([, l]) => l.toLowerCase() === v.toLowerCase())
              val(
                '503',
                withPrefix
                  ? `Not in the list for ${c.code}. Did you mean ${withPrefix}? Values need the eba_ prefix and exact case.`
                  : byLabel
                    ? `The label was typed instead of the code. Use ${byLabel[0]}.`
                    : `Not in the closed list for ${c.code} (${Object.keys(dom).length} allowed values).`,
              )
            }
            break
        }
      })
    }
  }
}

// --- business rules (DPM, severity warning) ----------------------------------

const EXISTENCE: Record<string, [string, string[]]> = {
  'B_01.01': ['e23677_e', ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060']],
  'B_01.02': ['e23676_e', ['c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090']],
  'B_01.03': ['e23675_e', ['c0010', 'c0020', 'c0030', 'c0040']],
  'B_02.01': ['e23792_e', ['c0020', 'c0040', 'c0050']],
  'B_02.02': ['e23680_e', ['c0040', 'c0050', 'c0060', 'c0070', 'c0080']],
  'B_04.01': ['e23683_e', ['c0030']],
  'B_05.01': ['e23674_e', ['c0020', 'c0050', 'c0060', 'c0070', 'c0080', 'c0110']],
  'B_06.01': ['e23682_e', ['c0020', 'c0030', 'c0050', 'c0070', 'c0080', 'c0090', 'c0100']],
}

const ROW_MANDATORY: Record<string, Record<string, string>> = {
  'B_01.01': { c0020: 'v8872_m', c0030: 'v8873_m', c0040: 'v8874_m', c0050: 'v8875_m', c0060: 'v8876_m' },
  'B_01.02': { c0020: 'v8858_m', c0030: 'v8859_m', c0040: 'v8860_m', c0050: 'v8861_m', c0060: 'v8862_m', c0070: 'v8863_m', c0080: 'v8864_m', c0090: 'v8865_m' },
  'B_01.03': { c0030: 'v8856_m', c0040: 'v8857_m' },
  'B_02.01': { c0020: 'v8866_m', c0040: 'v8867_m', c0050: 'v8868_m' },
  'B_02.02': { c0040: 'v8869_m', c0070: 'v8870_m', c0080: 'v8871_m' },
  'B_05.01': { c0020: 'v8850_m', c0050: 'v8851_m', c0060: 'v8852_m', c0070: 'v8853_m', c0080: 'v8854_m', c0110: 'v8855_m' },
  'B_06.01': { c0020: 'v8877_m', c0030: 'v8878_m', c0050: 'v8879_m', c0070: 'v8880_m', c0080: 'v8881_m', c0090: 'v8882_m', c0100: 'v8883_m' },
  'B_07.01': { c0050: 'v8884_m', c0070: 'v8885_m', c0080: 'v8886_m', c0100: 'v8888_m', c0110: 'v88889_m' },
}

const LEI_FORMAT: [string, string, string][] = [
  ['B_01.01', 'c0010', 'v8890_m'],
  ['B_01.02', 'c0010', 'v8891_m'],
  ['B_01.02', 'c0060', 'v8826_m'],
  ['B_01.03', 'c0020', 'v8892_m'],
]

function checkBusiness(reg: Register, out: Finding[]) {
  const biz = (rule: string, template: string, message: string, extra: Partial<Finding> = {}) =>
    push(out, { rule, layer: 'business', severity: 'warning', template, message, ...extra })

  for (const [code, [rule, cols]] of Object.entries(EXISTENCE)) {
    const data = reg.tables[code]
    if (!data || data.rows.length === 0) continue
    const ix = idx(data)
    for (const c of cols) {
      const i = ix[c]
      const any = i !== undefined && data.rows.some((r) => get(r, i) !== '')
      if (!any) biz(rule, code, `${c} is reported in no row of ${code}${i === undefined ? ' (the column is absent)' : ''}.`, { column: c })
    }
  }
  for (const [code, cols] of Object.entries(ROW_MANDATORY)) {
    const data = reg.tables[code]
    if (!data) continue
    const ix = idx(data)
    const t = tableByCode(code)!
    data.rows.forEach((row, r) => {
      for (const [c, rule] of Object.entries(cols)) {
        const i = ix[c]
        if (get(row, i) !== '') continue
        if (!rowHasContent(row, i ?? -1)) continue
        biz(rule, code, `${c} (${t.columns.find((x) => x.code === c)?.label}) must be filled when the row is reported.`, { row: r + 1, column: c })
      }
    })
  }
  // Conditional rules.
  const b0102 = reg.tables['B_01.02']
  if (b0102) {
    const ix = idx(b0102)
    b0102.rows.forEach((row, r) => {
      const type = get(row, ix['c0040'])
      const assets = get(row, ix['c0110'])
      const cur = get(row, ix['c0100'])
      if (assets !== '' && cur === '') biz('v8803_m', 'B_01.02', 'Total assets are reported, so the currency (c0100) must be too.', { row: r + 1, column: 'c0100' })
      if (type !== '' && type !== V.NON_FINANCIAL_ICT && type !== V.NON_FINANCIAL_OTHER && assets === '') {
        biz('v8804_m', 'B_01.02', 'A financial entity must report its total assets (c0110).', { row: r + 1, column: 'c0110' })
      }
      if (assets !== '' && NUM_RE.test(assets) && Number(assets) < 0) biz('v22913_s', 'B_01.02', 'Total assets cannot be negative.', { row: r + 1, column: 'c0110', value: assets })
    })
  }
  const b0201 = reg.tables['B_02.01']
  if (b0201) {
    const ix = idx(b0201)
    b0201.rows.forEach((row, r) => {
      if (get(row, ix['c0020']) === V.SUBSEQUENT_ARRANGEMENT && get(row, ix['c0030']) === '') {
        biz('v22912_m', 'B_02.01', 'A subsequent or associated arrangement must name its overarching arrangement in c0030.', { row: r + 1, column: 'c0030' })
      }
      const amt = get(row, ix['c0050'])
      if (amt !== '' && NUM_RE.test(amt) && Number(amt) < 0) biz('v23716_s', 'B_02.01', 'Annual expense cannot be negative.', { row: r + 1, column: 'c0050', value: amt })
    })
  }
  const b0701 = reg.tables['B_07.01']
  if (b0701) {
    const ix = idx(b0701)
    b0701.rows.forEach((row, r) => {
      const sub = get(row, ix['c0050'])
      if ((sub === V.NOT_SUBSTITUTABLE || sub === V.HIGHLY_COMPLEX_SUBSTITUTABILITY) && get(row, ix['c0060']) === '') {
        biz('v8825_m', 'B_07.01', 'When a provider is not (or only with high complexity) substitutable, the reason (c0060) is required.', { row: r + 1, column: 'c0060' })
      }
    })
  }
  for (const [code, col, rule] of LEI_FORMAT) {
    const data = reg.tables[code]
    if (!data) continue
    const i = idx(data)[col]
    if (i === undefined) continue
    data.rows.forEach((row, r) => {
      const v = get(row, i)
      if (v !== '' && !LEI_RE.test(v)) biz(rule, code, 'Value should be in valid LEI format (20 characters, ending in two digits).', { row: r + 1, column: col, value: v })
    })
  }
}

// --- identifiers (local) -----------------------------------------------------

/** Columns that hold an LEI unconditionally, and columns whose type column decides. */
export const LEI_COLS: [string, string, string | null][] = [
  ['B_01.01', 'c0010', null],
  ['B_01.02', 'c0010', null],
  ['B_01.02', 'c0060', null],
  ['B_01.03', 'c0020', null],
  ['B_02.02', 'c0020', null],
  ['B_02.02', 'c0030', 'c0040'],
  ['B_03.01', 'c0020', null],
  ['B_03.02', 'c0020', 'c0030'],
  ['B_03.03', 'c0020', null],
  ['B_04.01', 'c0020', null],
  ['B_05.01', 'c0010', 'c0020'],
  ['B_05.01', 'c0030', 'c0040'],
  ['B_05.01', 'c0110', 'c0120'],
  ['B_05.02', 'c0030', 'c0040'],
  ['B_05.02', 'c0060', 'c0070'],
  ['B_06.01', 'c0040', null],
  ['B_07.01', 'c0020', 'c0030'],
]

function checkIdentifiers(reg: Register, out: Finding[]) {
  const id = (rule: string, severity: Finding['severity'], template: string, message: string, extra: Partial<Finding> = {}) =>
    push(out, { rule, layer: 'identifiers', severity, template, message, ...extra })

  // Only where an identifier is defined (entities, branches, providers). A
  // bad code referenced elsewhere is either caught here or is a foreign-key
  // failure; flagging it per referencing table repeats one fact many times.
  const DEFINING = new Set(['B_01.01', 'B_01.02', 'B_01.03', 'B_05.01'])
  for (const [code, col, typeCol] of LEI_COLS) {
    if (!DEFINING.has(code)) continue
    const data = reg.tables[code]
    if (!data) continue
    const ix = idx(data)
    const i = ix[col]
    if (i === undefined) continue
    data.rows.forEach((row, r) => {
      const v = get(row, i)
      if (v === '') return
      const type = typeCol ? get(row, ix[typeCol]) : V.LEI
      if (isPlaceholderCode(v)) {
        id('AA-02', 'warning', code, 'This looks like a placeholder, not an identifier. Supervisors have said they will follow these up in the 2026 data-quality round.', { row: r + 1, column: col, value: v })
        return
      }
      if (type === V.LEI) {
        if (!LEI_RE.test(v)) {
          if (typeCol) id('AA-03', 'warning', code, 'Declared as an LEI but not 20 characters ending in two digits.', { row: r + 1, column: col, value: v })
        } else if (!leiChecksumOk(v)) {
          id('AA-01', 'warning', code, 'The LEI fails its ISO 17442 check digits, so one character is wrong. GLEIF will not find it.', { row: r + 1, column: col, value: v })
        }
      } else if (type === V.EUID && !euidFormatOk(v)) {
        id('VR_72', 'warning', code, 'Declared as an EUID but not in EUID form: an EEA country code, a register identifier, a dot, then the registration number (e.g. NLNHR.12345678). 58,170 EUIDs failed this in the 2025 collection.', { row: r + 1, column: col, value: v })
      }
    })
  }
  const b0501 = reg.tables['B_05.01']
  if (b0501) {
    const ix = idx(b0501)
    b0501.rows.forEach((row, r) => {
      const person = get(row, ix['c0070'])
      const type = get(row, ix['c0020'])
      const hq = get(row, ix['c0080']).replace(/^eba_GA:/, '')
      if (person === 'eba_CT:x212' && type !== '' && type !== V.LEI && type !== V.EUID) {
        id('AA-04', 'insight', 'B_05.01', 'The ITS allows only an LEI or EUID for a legal person. The DPM rule enforcing this (v8817_m) was switched off in March 2025, so it will not be rejected, but it is what the regulation asks for.', { row: r + 1, column: 'c0020', value: type })
      }
      if (person === 'eba_CT:x212' && type !== '' && type !== V.LEI && hq !== '' && !EEA.has(hq)) {
        id('AA-05', 'insight', 'B_05.01', 'A legal person headquartered outside the EEA may only be identified by an LEI under the ITS; an EUID or national code cannot exist for it.', { row: r + 1, column: 'c0020', value: type })
      }
    })
  }
}

// --- consistency the ITS asks for but the DPM does not enforce ---------------

function checkConsistency(reg: Register, out: Finding[]) {
  const con = (rule: string, severity: Finding['severity'], template: string, message: string, extra: Partial<Finding> = {}) =>
    push(out, { rule, layer: 'business', severity, template, message, ...extra })

  const b0202 = reg.tables['B_02.02']
  const b0601 = reg.tables['B_06.01']
  const b0701 = reg.tables['B_07.01']
  const b0501 = reg.tables['B_05.01']
  const b0302 = reg.tables['B_03.02']

  // Critical functions, keyed by (function id, entity LEI).
  const critical = new Set<string>()
  if (b0601) {
    const ix = idx(b0601)
    b0601.rows.forEach((row, r) => {
      if (get(row, ix['c0050']) === V.YES) critical.add(`${get(row, ix['c0010'])}${SEP}${get(row, ix['c0040'])}`)
      const rto = get(row, ix['c0080'])
      const rpo = get(row, ix['c0090'])
      if (INT_RE.test(rto) && INT_RE.test(rpo) && Number(rpo) > Number(rto) && Number(rto) > 0) {
        con('AA-14', 'insight', 'B_06.01', 'The recovery point objective is longer than the recovery time objective. Possible, but unusual enough to be worth a second look.', { row: r + 1, column: 'c0090', value: `RTO ${rto}h, RPO ${rpo}h` })
      }
      if (get(row, ix['c0050']) === V.YES && get(row, ix['c0070']) === OPEN_ENDED) {
        con('AA-15', 'warning', 'B_06.01', 'The function is assessed as critical or important but the date of that assessment is the "not performed" placeholder 9999-12-31.', { row: r + 1, column: 'c0070' })
      }
    })
  }
  const assessed = new Set<string>()
  if (b0701) {
    const ix = idx(b0701)
    b0701.rows.forEach((row) => assessed.add(`${get(row, ix['c0010'])}${SEP}${get(row, ix['c0020'])}${SEP}${get(row, ix['c0040'])}`))
  }
  if (b0202) {
    const ix = idx(b0202)
    const missingAssessment = new Set<string>()
    b0202.rows.forEach((row, r) => {
      const start = get(row, ix['c0070'])
      const end = get(row, ix['c0080'])
      if (validIsoDate(start) && validIsoDate(end) && end !== OPEN_ENDED && end < start) {
        con('AA-06', 'warning', 'B_02.02', 'The contract ends before it starts. The DPM rule for this (v8816_m) was switched off in March 2025, which does not make the dates right.', { row: r + 1, column: 'c0080', value: `${start} to ${end}` })
      }
      if (validIsoDate(end) && end !== OPEN_ENDED && get(row, ix['c0090']) === '' && reg.meta.parameters?.refPeriod && end <= reg.meta.parameters.refPeriod) {
        con('AA-07', 'insight', 'B_02.02', 'The arrangement ended on or before the reference date but no reason for termination (c0090) is given.', { row: r + 1, column: 'c0090', value: end })
      }
      const isCritical = critical.has(`${get(row, ix['c0050'])}${SEP}${get(row, ix['c0020'])}`)
      if (isCritical) {
        for (const [c, label] of [
          ['c0100', 'notice period for the entity'],
          ['c0110', 'notice period for the provider'],
          ['c0120', 'governing law'],
          ['c0140', 'storage of data'],
          ['c0180', 'level of reliance'],
        ]) {
          if (get(row, ix[c]) === '') {
            con('AA-08', 'warning', 'B_02.02', `This service supports a critical or important function, so the ITS makes the ${label} (${c}) mandatory. No DPM rule enforces it, so it will not be rejected; it will be missing.`, { row: r + 1, column: c })
          }
        }
        if (get(row, ix['c0140']) === V.YES && get(row, ix['c0170']) === '') {
          con('AA-08', 'warning', 'B_02.02', 'Data is stored for a critical service, so the sensitiveness of that data (c0170) is mandatory under the ITS.', { row: r + 1, column: 'c0170' })
        }
        const k = `${get(row, ix['c0010'])}${SEP}${get(row, ix['c0030'])}${SEP}${get(row, ix['c0060'])}`
        if (b0701 && !assessed.has(k) && !missingAssessment.has(k)) {
          missingAssessment.add(k)
          con('AA-09', 'warning', 'B_02.02', 'This service supports a critical or important function but has no risk assessment row in B_07.01 for the same contract, provider and service type.', { row: r + 1, column: 'c0010+c0030+c0060', value: k.split(SEP).join(' | ') })
        }
      }
      if (get(row, ix['c0140']) === V.NO && get(row, ix['c0150']) !== '' && get(row, ix['c0150']) !== V.NOT_APPLICABLE_COUNTRY) {
        con('AA-10', 'insight', 'B_02.02', 'No data is stored (c0140 = No) yet a storage location is given in c0150. The FAQ says to use eba_GA:qx2007 here.', { row: r + 1, column: 'c0150', value: get(row, ix['c0150']) })
      }
    })
  }
  // Direct providers must carry an annual expense.
  if (b0501 && b0302) {
    const direct = new Set<string>()
    const ix2 = idx(b0302)
    b0302.rows.forEach((row) => direct.add(get(row, ix2['c0020'])))
    const ix = idx(b0501)
    b0501.rows.forEach((row, r) => {
      const code = get(row, ix['c0010'])
      if (direct.has(code) && get(row, ix['c0100']) === '') {
        con('AA-11', 'warning', 'B_05.01', 'This provider signs at least one contract, so it is a direct provider and the ITS requires its total annual expense (c0100).', { row: r + 1, column: 'c0100', value: code })
      }
      const up = get(row, ix['c0110'])
      if (up !== '' && up !== code && get(row, ix['c0120']) === '') {
        con('AA-12', 'warning', 'B_05.01', 'An ultimate parent code is given without its code type (c0120).', { row: r + 1, column: 'c0120' })
      }
    })
    // Same name, different codes.
    const byName = new Map<string, Set<string>>()
    b0501.rows.forEach((row) => {
      const n = (get(row, ix['c0060']) || get(row, ix['c0050'])).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
      if (!n) return
      if (!byName.has(n)) byName.set(n, new Set())
      byName.get(n)!.add(get(row, ix['c0010']))
    })
    for (const [n, codes] of byName) {
      if (codes.size > 1) {
        con('AA-13', 'insight', 'B_05.01', `"${n}" appears under ${codes.size} different identification codes. One provider, or several legal entities with the same trading name?`, { column: 'c0010', value: [...codes].join(' | ') })
      }
    }
  }
}
