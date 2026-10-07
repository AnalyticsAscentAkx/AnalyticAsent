// Open reference data the EBA's own checks do not carry.
//
// Everything here is public and dated. The critical-provider list is the one
// the three European Supervisory Authorities published on 18 November 2025
// under Article 31(9) DORA; it is a one-page PDF of nineteen names with no
// identifiers, so the LEIs beside them were looked up in GLEIF by hand and
// carry a confidence note. The adequacy list is the European Commission's.
// Country groupings follow ISO 3166-1 alpha-2, which is also what the eba_GA
// codes wrap.

export interface CriticalProvider {
  /** Name exactly as printed in the ESAs' list, typos included. */
  name: string
  lei?: string
  country: string
  /** Lower-case fragments that identify the provider in a free-text legal name. */
  match: string[]
  /** Also designated a Critical Third Party by HM Treasury (UK), 10 July 2026. */
  uk?: boolean
}

export const CTPP_PUBLISHED = '2025-11-18'

export const CTPPS: CriticalProvider[] = [
  { name: 'Accenture plc', lei: '5493000EWHDSR3MZWH98', country: 'IE', match: ['accenture'] },
  { name: 'Amazon web Services EMEA Sarl', country: 'LU', match: ['amazon web services', 'aws emea'], uk: true },
  { name: 'Bloomberg L.P.', lei: '549300B56MD0ZC402L06', country: 'US', match: ['bloomberg'] },
  { name: 'Capgemini SE', lei: '96950077L0TN7BAROX36', country: 'FR', match: ['capgemini'] },
  { name: 'Colt Technology Services', lei: '3912000PY0VABHVJX679', country: 'GB', match: ['colt technology'] },
  { name: 'Deutsche Telekom AG', lei: '549300V9QSIG4WX4GJ96', country: 'DE', match: ['deutsche telekom', 't-systems'] },
  { name: 'Equinix (EMEA) B.V.', lei: '5493000WWMF7GKM9Z338', country: 'NL', match: ['equinix'] },
  { name: 'Fidelity National Information Services, Inc.', lei: '6WQI0GK1PRFVBA061U48', country: 'US', match: ['fidelity national information', 'fis global'] },
  { name: 'Google Cloud EMEA Limited', lei: '98450052CF14CFEB6435', country: 'IE', match: ['google cloud'], uk: true },
  { name: 'International Business Machine Corporation', lei: 'VGRQXHF3J8VDLUA7XE92', country: 'US', match: ['international business machines', 'ibm'] },
  { name: 'InterXion HeadQuarters B.V.', country: 'NL', match: ['interxion'] },
  { name: 'Kyndryl Inc.', lei: '549300RS9ZY2LETFSE98', country: 'US', match: ['kyndryl'] },
  { name: 'LSEG Data and Risk Limited', lei: '213800WMU3E82HA1SY94', country: 'GB', match: ['lseg', 'refinitiv', 'london stock exchange group'] },
  { name: 'Microsoft Ireland Operations Limited', lei: '549300WCLFVEBTBNRF76', country: 'IE', match: ['microsoft'], uk: true },
  { name: 'NTT DATA Inc.', country: 'JP', match: ['ntt data'] },
  { name: 'Oracle Nederland B.V.', country: 'NL', match: ['oracle'], uk: true },
  { name: 'Orange SA', lei: '969500MCOONR8990S771', country: 'FR', match: ['orange sa', 'orange business'] },
  { name: 'SAP SE', lei: '529900D6BF99LW9R2E68', country: 'DE', match: ['sap se', 'sap '] },
  { name: 'Tata Consultancy Services Limited', lei: '335800ZJKU9GPQRE2U66', country: 'IN', match: ['tata consultancy'] },
]

const CTPP_BY_LEI = new Map(CTPPS.filter((c) => c.lei).map((c) => [c.lei!, c]))

/** Match a provider row to the critical list by LEI first, then by name. */
export function matchCtpp(lei: string | undefined, ...names: (string | undefined)[]): CriticalProvider | undefined {
  if (lei && CTPP_BY_LEI.has(lei)) return CTPP_BY_LEI.get(lei)
  const hay = names
    .filter(Boolean)
    .map((n) => ` ${n!.toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ')} `)
    .join(' ')
  if (!hay.trim()) return undefined
  for (const c of CTPPS) {
    if (c.match.some((m) => hay.includes(m.endsWith(' ') ? m : ` ${m}`) || hay.includes(` ${m}`))) return c
  }
  return undefined
}

export const EU = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV',
  'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])
export const EEA = new Set([...EU, 'IS', 'LI', 'NO'])

/** Commission adequacy decisions under Art. 45 GDPR. 'partial' means the
 *  decision covers only some transfers: Canada (commercial organisations),
 *  the United States (organisations certified under the Data Privacy
 *  Framework only). */
export const ADEQUACY: Record<string, 'full' | 'partial'> = {
  AD: 'full', AR: 'full', BR: 'full', CA: 'partial', FO: 'full', GG: 'full', IL: 'full', IM: 'full',
  JP: 'full', JE: 'full', NZ: 'full', KR: 'full', CH: 'full', GB: 'full', US: 'partial', UY: 'full',
}

export type LocationClass = 'eea' | 'adequate' | 'partial' | 'third-country' | 'not-applicable' | 'unknown'

export function classifyLocation(code: string): LocationClass {
  const cc = code.replace(/^eba_GA:/, '')
  if (cc === 'qx2007') return 'not-applicable'
  if (!/^[A-Z]{2}$/.test(cc)) return 'unknown'
  if (EEA.has(cc)) return 'eea'
  if (ADEQUACY[cc] === 'full') return 'adequate'
  if (ADEQUACY[cc] === 'partial') return 'partial'
  return 'third-country'
}

// --- Identifiers ------------------------------------------------------------

export const LEI_RE = /^[A-Z0-9]{18}[0-9]{2}$/

/** ISO 17442 check digits (ISO/IEC 7064 MOD 97-10). A code that passes the
 *  EBA's regex can still be a typo; this catches a single wrong character,
 *  which the regex cannot, and does it without a network call. */
export function leiChecksumOk(lei: string): boolean {
  if (!LEI_RE.test(lei)) return false
  let rem = 0
  for (const ch of lei) {
    const v = ch >= 'A' ? ch.charCodeAt(0) - 55 : ch.charCodeAt(0) - 48
    // Feed the digits of v one at a time (letters contribute two digits).
    for (const d of String(v)) rem = (rem * 10 + Number(d)) % 97
  }
  return rem === 1
}

/** The shapes people type when they have no identifier and the template
 *  will not accept a blank. Supervisors have said they will chase these in
 *  the 2026 data-quality round. */
export function isPlaceholderCode(v: string): boolean {
  const s = v.trim().toUpperCase()
  if (!s) return false
  if (/DUMMY|PLACEHOLDER|UNKNOWN|NOLEI|NO_LEI|^N\/?A$|^TBD$|^TBC$|^XXX/.test(s)) return true
  if (/^(.)\1{7,}$/.test(s)) return true // one character repeated
  if (/^9{7,}/.test(s)) return true
  if (/^0{7,}/.test(s)) return true
  if (/^(1234567890|ABCDEFGH)/.test(s)) return true
  return false
}

/** EUID as defined by Implementing Regulation (EU) 2021/1042: an EEA country
 *  code, a register identifier, a dot, then the registration number. The EBA
 *  checks the dot and the country; the register (BRIS) itself has no open
 *  interface, so existence cannot be verified from a browser. */
export function euidFormatOk(v: string): boolean {
  const s = v.trim()
  if (!/^[A-Z]{2}[A-Z0-9]*\.[A-Za-z0-9._-]+$/.test(s)) return false
  return EEA.has(s.slice(0, 2)) || s.startsWith('GB')
}

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validIsoDate(s: string): boolean {
  if (!ISO_DATE_RE.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  if (m < 1 || m > 12 || d < 1) return false
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return d <= days
}

export const OPEN_ENDED = '9999-12-31'
