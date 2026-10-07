// A register to try the checker on.
//
// The group is invented: Veldhaven Bank N.V. and its two subsidiaries do not
// exist, and their LEIs are synthetic (they pass the check-digit test and
// nothing else, so GLEIF will report them as not found, which is the right
// answer). The ICT providers are real companies with their real, public LEIs,
// because a register made of fictional providers would say nothing about
// concentration. Ten or so mistakes are seeded on purpose, each of a kind the
// 2025 collection actually produced; they are listed in SEEDED so the page can
// say what to expect, and the tests check that each one is caught.

import { toCsv } from './csv'
import { registerFromStrings } from './load'
import type { Register } from './types'

/** ISO 17442 check digits for an 18-character prefix. */
export function withCheckDigits(prefix18: string): string {
  const s = `${prefix18}00`
  let rem = 0
  for (const ch of s) {
    const v = ch >= 'A' ? ch.charCodeAt(0) - 55 : ch.charCodeAt(0) - 48
    for (const d of String(v)) rem = (rem * 10 + Number(d)) % 97
  }
  const check = 98 - rem
  return `${prefix18}${String(check).padStart(2, '0')}`
}

// Group entities (synthetic LEIs).
export const E1 = withCheckDigits('7245009VELDHAVENBK')
export const E2 = withCheckDigits('7245009VELDHAVENVZ')
export const E3 = withCheckDigits('7245009VELDHAVENIT')

// Providers (real public LEIs).
const MS_IE = '549300WCLFVEBTBNRF76'
const MS_CORP = 'INR2EJN1ERAN0W5ZP974'
const GOOGLE_IE = '98450052CF14CFEB6435'
const ALPHABET = '5493006MHB84DD0ZWV18'
const AWS_EMEA_EUID = 'LURCSL.B186284'
const AWS_INC = '2549000I2PRQGGIGCA75'
const SAP = '529900D6BF99LW9R2E68'
const TCS = '335800ZJKU9GPQRE2U66'
const TATA_SONS = '335800YLT7FVL71YN622' // deliberately NOT given a B_05.01 row
const EQUINIX_NL = '5493000WWMF7GKM9Z338'
const EQUINIX_INC = '549300EVUN2BTLJ3GT74'
const BRIGHTWATER = 'DUMMYLEI000000000000' // deliberate placeholder
const KESSELVOS = 'NL.KVK.87654321' // national code for a legal person

export const REF_DATE = '2025-12-31'
export const SAMPLE_ZIP_NAME = `${E1}.CON_NL_DORA010100_DORA_${REF_DATE}_20260310141500000.zip`

export const SEEDED: { rule: string; where: string; what: string }[] = [
  { rule: '807', where: 'B_05.01', what: 'Tata Consultancy Services names Tata Sons as its ultimate parent, but Tata Sons has no row of its own (the most common rejection in 2025).' },
  { rule: '807', where: 'B_02.02', what: 'One service row points at function F9, which B_06.01 never defines.' },
  { rule: '806', where: 'B_03.02', what: 'The SAP signing row is in twice.' },
  { rule: '503', where: 'B_02.02', what: 'A service type of eba_TA:S20 — there are nineteen.' },
  { rule: '330', where: 'B_07.01', what: 'An audit date typed as 31/12/2025.' },
  { rule: 'v22912_m', where: 'B_02.01', what: 'A subsequent arrangement with no overarching arrangement named.' },
  { rule: 'v8825_m', where: 'B_07.01', what: 'A provider marked not substitutable, with no reason.' },
  { rule: 'AA-01', where: 'B_05.01', what: 'An additional LEI for SAP with one digit wrong.' },
  { rule: 'AA-02', where: 'B_05.01', what: 'A data-centre provider identified as DUMMYLEI000000000000.' },
  { rule: 'AA-06', where: 'B_02.02', what: 'A contract that ends before it starts.' },
  { rule: 'AA-09', where: 'B_02.02', what: 'A critical hosting service with no B_07.01 risk assessment.' },
  { rule: 'AA-08', where: 'B_02.02', what: 'A critical service row with the notice periods left blank.' },
]

const Y = 'eba_BT:x28'
const N = 'eba_BT:x29'
const LEI = 'eba_qCO:qx2000'
const NATIONAL = 'eba_qCO:qx2001'
const EUID = 'eba_qCO:qx2002'
const NA = 'eba_GA:qx2007'
const ga = (c: string) => `eba_GA:${c}`

export function buildSample(): Register {
  const b0101 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060'],
    [[E1, 'Veldhaven Bank N.V.', ga('NL'), 'eba_CT:x12', 'De Nederlandsche Bank', REF_DATE]],
  )

  const b0102 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110'],
    [
      [E1, 'Veldhaven Bank N.V.', ga('NL'), 'eba_CT:x12', 'eba_RP:x53', E1, '2025-12-15', '2025-01-17', '9999-12-31', 'eba_CU:EUR', '48200000000'],
      [E2, 'Veldhaven Verzekeringen N.V.', ga('NL'), 'eba_CT:x309', 'eba_RP:x56', E1, '2025-12-15', '2025-01-17', '9999-12-31', 'eba_CU:EUR', '9100000000'],
      [E3, 'Veldhaven ICT Services B.V.', ga('NL'), 'eba_CT:x317', 'eba_RP:x56', E1, '2025-12-15', '2025-01-17', '9999-12-31', '', ''],
    ],
  )

  const b0103 = toCsv(['c0010', 'c0020', 'c0030', 'c0040'], [['BR-BE-01', E1, 'Veldhaven Bank N.V. Brussels Branch', ga('BE')]])

  const b0201 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050'],
    [
      ['C-2021-001', 'eba_CO:x2', '', 'eba_CU:EUR', '3400000'],
      ['C-2021-001-A', 'eba_CO:x3', 'C-2021-001', 'eba_CU:EUR', '0'],
      ['C-2022-014', 'eba_CO:x1', '', 'eba_CU:EUR', '2900000'],
      ['C-2023-007', 'eba_CO:x1', '', 'eba_CU:EUR', '850000'],
      ['C-2019-003', 'eba_CO:x1', '', 'eba_CU:EUR', '1200000'],
      ['C-2020-011', 'eba_CO:x1', '', 'eba_CU:EUR', '2100000'],
      ['C-2018-002', 'eba_CO:x1', '', 'eba_CU:EUR', '640000'],
      ['C-2024-021', 'eba_CO:x1', '', 'eba_CU:EUR', '310000'],
      ['C-IG-2020-001', 'eba_CO:x1', '', 'eba_CU:EUR', '5600000'],
      ['C-2024-030', 'eba_CO:x3', '', 'eba_CU:EUR', '0'], // seeded: v22912_m
    ],
  )

  // contract, entity, provider, type, function, service, start, end, reason,
  // notice FE, notice TPP, governing law, country of provision, storage, at rest, processing, sensitiveness, reliance
  const S = (a: string[]) => a
  const b0202 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120', 'c0130', 'c0140', 'c0150', 'c0160', 'c0170', 'c0180'],
    [
      S(['C-2021-001', E1, MS_IE, LEI, 'F1', 'eba_TA:S19', '2021-04-01', '9999-12-31', '', '180', '365', ga('IE'), ga('NL'), Y, ga('NL'), ga('IE'), 'eba_ZZ:x793', 'eba_ZZ:x796']),
      S(['C-2021-001', E1, MS_IE, LEI, 'F3', 'eba_TA:S19', '2021-04-01', '9999-12-31', '', '90', '180', ga('IE'), ga('NL'), Y, ga('NL'), ga('IE'), 'eba_ZZ:x792', 'eba_ZZ:x795']),
      S(['C-2021-001-A', E2, MS_IE, LEI, 'F4', 'eba_TA:S19', '2022-01-10', '9999-12-31', '', '180', '365', ga('IE'), ga('NL'), Y, ga('NL'), ga('IE'), 'eba_ZZ:x793', 'eba_ZZ:x796']),
      S(['C-2022-014', E1, AWS_EMEA_EUID, EUID, 'F2', 'eba_TA:S17', '2022-06-01', '9999-12-31', '', '', '', ga('LU'), ga('IE'), Y, ga('US'), ga('IE'), 'eba_ZZ:x793', 'eba_ZZ:x797']), // seeded: AA-08 notice periods blank
      S(['C-2022-014', E1, AWS_EMEA_EUID, EUID, 'F6', 'eba_TA:S18', '2022-06-01', '9999-12-31', '', '90', '90', ga('LU'), ga('IE'), Y, ga('IE'), ga('IE'), 'eba_ZZ:x792', 'eba_ZZ:x796']),
      S(['C-2023-007', E2, GOOGLE_IE, LEI, 'F5', 'eba_TA:S06', '2023-03-01', '9999-12-31', '', '30', '30', ga('IE'), ga('NL'), Y, ga('BE'), ga('IE'), 'eba_ZZ:x791', 'eba_ZZ:x794']),
      S(['C-2019-003', E1, SAP, LEI, 'F2', 'eba_TA:S13', '2019-01-01', '9999-12-31', '', '365', '365', ga('DE'), ga('NL'), N, NA, NA, '', 'eba_ZZ:x796']),
      S(['C-2020-011', E1, TCS, LEI, 'F1', 'eba_TA:S14', '2020-10-01', '9999-12-31', '', '180', '180', ga('GB'), ga('NL'), Y, ga('IN'), ga('IN'), 'eba_ZZ:x793', 'eba_ZZ:x796']),
      S(['C-2020-011', E1, TCS, LEI, 'F2', 'eba_TA:S02', '2020-10-01', '9999-12-31', '', '180', '180', ga('GB'), ga('NL'), Y, ga('IN'), ga('IN'), 'eba_ZZ:x792', 'eba_ZZ:x795']),
      S(['C-2018-002', E3, BRIGHTWATER, LEI, 'F7', 'eba_TA:S07', '2018-02-01', '9999-12-31', '', '365', '365', ga('NL'), ga('NL'), Y, ga('NL'), ga('NL'), 'eba_ZZ:x793', 'eba_ZZ:x797']),
      S(['C-2024-021', E1, KESSELVOS, NATIONAL, 'F3', 'eba_TA:S15', '2024-09-01', '2024-03-31', '', '30', '30', ga('NL'), ga('NL'), N, NA, NA, '', 'eba_ZZ:x794']), // seeded: AA-06 ends before start
      S(['C-IG-2020-001', E1, E3, LEI, 'F1', 'eba_TA:S07', '2020-01-01', '9999-12-31', '', '365', '365', ga('NL'), ga('NL'), Y, ga('NL'), ga('NL'), 'eba_ZZ:x793', 'eba_ZZ:x797']),
      S(['C-IG-2020-001', E1, E3, LEI, 'F2', 'eba_TA:S07', '2020-01-01', '9999-12-31', '', '365', '365', ga('NL'), ga('NL'), Y, ga('NL'), ga('NL'), 'eba_ZZ:x793', 'eba_ZZ:x797']),
      S(['C-IG-2020-001', E2, E3, LEI, 'F4', 'eba_TA:S07', '2020-01-01', '9999-12-31', '', '365', '365', ga('NL'), ga('NL'), Y, ga('NL'), ga('NL'), 'eba_ZZ:x793', 'eba_ZZ:x797']),
      S(['C-2024-030', E2, GOOGLE_IE, LEI, 'F9', 'eba_TA:S20', '2024-11-01', '9999-12-31', '', '30', '30', ga('IE'), ga('NL'), N, NA, NA, '', 'eba_ZZ:x794']), // seeded: 807 (F9) and 503 (S20)
    ],
  )

  const b0203 = toCsv(['c0010', 'c0020', 'c0030'], [['C-IG-2020-001', 'C-2018-002', 'true']])

  const b0301 = toCsv(
    ['c0010', 'c0020', 'c0030'],
    [
      ['C-2021-001', E1, 'true'],
      ['C-2021-001-A', E2, 'true'],
      ['C-2022-014', E1, 'true'],
      ['C-2023-007', E2, 'true'],
      ['C-2019-003', E1, 'true'],
      ['C-2020-011', E1, 'true'],
      ['C-2018-002', E3, 'true'],
      ['C-2024-021', E1, 'true'],
      ['C-IG-2020-001', E1, 'true'],
      ['C-IG-2020-001', E2, 'true'],
      ['C-2024-030', E2, 'true'],
    ],
  )

  const b0302 = toCsv(
    ['c0010', 'c0020', 'c0030'],
    [
      ['C-2021-001', MS_IE, LEI],
      ['C-2021-001-A', MS_IE, LEI],
      ['C-2022-014', AWS_EMEA_EUID, EUID],
      ['C-2023-007', GOOGLE_IE, LEI],
      ['C-2019-003', SAP, LEI],
      ['C-2019-003', SAP, LEI], // seeded: 806 duplicate
      ['C-2020-011', TCS, LEI],
      ['C-2018-002', BRIGHTWATER, LEI],
      ['C-2024-021', KESSELVOS, NATIONAL],
      ['C-IG-2020-001', E3, LEI],
      ['C-2024-030', GOOGLE_IE, LEI],
    ],
  )

  const b0303 = toCsv(['c0010', 'c0020', 'c0031'], [['C-IG-2020-001', E3, 'true']])

  const b0401 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040'],
    [
      ['C-2021-001', E1, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2021-001', E1, 'eba_ZZ:x838', 'BR-BE-01'],
      ['C-2021-001-A', E2, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2022-014', E1, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2023-007', E2, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2019-003', E1, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2020-011', E1, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2018-002', E3, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2024-021', E1, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-IG-2020-001', E1, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-IG-2020-001', E2, 'eba_ZZ:x839', 'Not Applicable'],
      ['C-2024-030', E2, 'eba_ZZ:x839', 'Not Applicable'],
    ],
  )

  // code, type, add. code, add. type, legal name, latin name, person, HQ, currency, expense, UP code, UP type
  const b0501 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120'],
    [
      [MS_IE, LEI, '', '', 'Microsoft Ireland Operations Limited', 'Microsoft Ireland Operations Limited', 'eba_CT:x212', ga('IE'), 'eba_CU:EUR', '3400000', MS_CORP, LEI],
      [MS_CORP, LEI, '', '', 'Microsoft Corporation', 'Microsoft Corporation', 'eba_CT:x212', ga('US'), '', '', MS_CORP, LEI],
      [AWS_EMEA_EUID, EUID, '', '', 'Amazon Web Services EMEA SARL', 'Amazon Web Services EMEA SARL', 'eba_CT:x212', ga('LU'), 'eba_CU:EUR', '2900000', AWS_INC, LEI],
      [AWS_INC, LEI, '', '', 'Amazon Web Services, Inc.', 'Amazon Web Services, Inc.', 'eba_CT:x212', ga('US'), '', '', AWS_INC, LEI],
      [GOOGLE_IE, LEI, '', '', 'Google Cloud EMEA Limited', 'Google Cloud EMEA Limited', 'eba_CT:x212', ga('IE'), 'eba_CU:EUR', '850000', ALPHABET, LEI],
      [ALPHABET, LEI, '', '', 'Alphabet Inc.', 'Alphabet Inc.', 'eba_CT:x212', ga('US'), '', '', ALPHABET, LEI],
      [SAP, LEI, '529900D6BF99LW9R2E69', LEI, 'SAP SE', 'SAP SE', 'eba_CT:x212', ga('DE'), 'eba_CU:EUR', '1200000', SAP, LEI], // seeded: AA-01 wrong check digit in c0030
      [TCS, LEI, '', '', 'Tata Consultancy Services Limited', 'Tata Consultancy Services Limited', 'eba_CT:x212', ga('IN'), 'eba_CU:EUR', '2100000', TATA_SONS, LEI], // seeded: 807, no Tata Sons row
      [BRIGHTWATER, LEI, '', '', 'Brightwater Datacenters B.V.', 'Brightwater Datacenters B.V.', 'eba_CT:x212', ga('NL'), 'eba_CU:EUR', '640000', BRIGHTWATER, LEI], // seeded: AA-02
      [KESSELVOS, NATIONAL, '', '', 'Kessel & Vos IT Consultancy B.V.', 'Kessel & Vos IT Consultancy B.V.', 'eba_CT:x212', ga('NL'), 'eba_CU:EUR', '310000', KESSELVOS, NATIONAL],
      [E3, LEI, '', '', 'Veldhaven ICT Services B.V.', 'Veldhaven ICT Services B.V.', 'eba_CT:x212', ga('NL'), 'eba_CU:EUR', '5600000', E1, LEI],
      [E1, LEI, '', '', 'Veldhaven Bank N.V.', 'Veldhaven Bank N.V.', 'eba_CT:x212', ga('NL'), '', '', E1, LEI],
      [EQUINIX_NL, LEI, '', '', 'Equinix (EMEA) B.V.', 'Equinix (EMEA) B.V.', 'eba_CT:x212', ga('NL'), '', '', EQUINIX_INC, LEI],
      [EQUINIX_INC, LEI, '', '', 'Equinix, Inc.', 'Equinix, Inc.', 'eba_CT:x212', ga('US'), '', '', EQUINIX_INC, LEI],
    ],
  )

  const b0502 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070'],
    [
      ['C-2018-002', 'eba_TA:S07', BRIGHTWATER, LEI, '1', BRIGHTWATER, LEI],
      ['C-2018-002', 'eba_TA:S07', EQUINIX_NL, LEI, '2', BRIGHTWATER, LEI],
      ['C-2021-001', 'eba_TA:S19', MS_IE, LEI, '1', MS_IE, LEI],
      ['C-2022-014', 'eba_TA:S17', AWS_EMEA_EUID, EUID, '1', AWS_EMEA_EUID, EUID],
      ['C-IG-2020-001', 'eba_TA:S07', E3, LEI, '1', E3, LEI],
      ['C-IG-2020-001', 'eba_TA:S07', BRIGHTWATER, LEI, '2', E3, LEI],
    ],
  )

  const b0601 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100'],
    [
      ['F1', 'eba_TA:x222', 'Payment processing', E1, Y, 'Direct customer impact; regulatory settlement deadlines', '2025-09-15', '2', '1', 'eba_ZZ:x793'],
      ['F2', 'eba_TA:x162', 'Core banking ledger', E1, Y, 'All balances and positions depend on it', '2025-09-15', '4', '1', 'eba_ZZ:x793'],
      ['F3', 'eba_TA:x276', 'HR and payroll', E1, N, '', '2025-09-15', '72', '24', 'eba_ZZ:x791'],
      ['F4', 'eba_TA:x189', 'Claims handling (property)', E2, Y, 'Policyholder payments; Solvency II reporting', '2025-10-02', '24', '4', 'eba_ZZ:x792'],
      ['F5', 'eba_TA:x276', 'Marketing analytics', E2, N, '', '2025-10-02', '0', '0', 'eba_ZZ:x791'],
      ['F6', 'eba_TA:x168', 'Treasury and own-account trading', E1, Y, 'Liquidity management; intraday', '2025-09-15', '1', '1', 'eba_ZZ:x793'],
      ['F7', 'eba_TA:x276', 'Group data-centre hosting', E3, Y, 'Hosts F1, F2 and F4 for the group', '2025-09-15', '4', '1', 'eba_ZZ:x793'],
    ],
  )

  // contract, provider, type, service, substitutability, reason, last audit, exit plan, reintegration, impact, alternatives, alt. names
  const b0701 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120'],
    [
      ['C-2021-001', MS_IE, LEI, 'eba_TA:S19', 'eba_ZZ:x960', 'eba_ZZ:x964', '2025-05-20', Y, 'eba_ZZ:x966', 'eba_ZZ:x793', Y, 'Google Workspace'],
      ['C-2021-001-A', MS_IE, LEI, 'eba_TA:S19', 'eba_ZZ:x960', 'eba_ZZ:x964', '2025-05-20', Y, 'eba_ZZ:x966', 'eba_ZZ:x792', Y, 'Google Workspace'],
      ['C-2022-014', AWS_EMEA_EUID, EUID, 'eba_TA:S17', 'eba_ZZ:x959', '', '31/12/2025', N, 'eba_ZZ:x967', 'eba_ZZ:x793', N, ''], // seeded: v8825_m, 330
      ['C-2022-014', AWS_EMEA_EUID, EUID, 'eba_TA:S18', 'eba_ZZ:x961', '', '2025-03-11', Y, 'eba_ZZ:x966', 'eba_ZZ:x792', Y, 'Microsoft Azure'],
      ['C-2019-003', SAP, LEI, 'eba_TA:S13', 'eba_ZZ:x960', 'eba_ZZ:x965', '2024-11-04', Y, 'eba_ZZ:x0', 'eba_ZZ:x793', N, ''],
      ['C-2020-011', TCS, LEI, 'eba_TA:S14', 'eba_ZZ:x961', '', '2025-06-30', Y, 'eba_ZZ:x966', 'eba_ZZ:x792', Y, 'Infosys; Cognizant'],
      ['C-2020-011', TCS, LEI, 'eba_TA:S02', 'eba_ZZ:x962', '', '2025-06-30', Y, 'eba_ZZ:x798', 'eba_ZZ:x791', Y, 'Infosys; Cognizant'],
      ['C-IG-2020-001', E3, LEI, 'eba_TA:S07', 'eba_ZZ:x960', 'eba_ZZ:x964', '2025-09-15', Y, 'eba_ZZ:x0', 'eba_ZZ:x793', Y, 'Equinix direct'],
      // C-2018-002 / Brightwater / S07 deliberately absent: AA-09
    ],
  )

  const b9901 = toCsv(
    ['c0010', 'c0020', 'c0030', 'c0040', 'c0050', 'c0060', 'c0070', 'c0080', 'c0090', 'c0100', 'c0110', 'c0120', 'c0130', 'c0140', 'c0150', 'c0160', 'c0170', 'c0180', 'c0190'],
    [[
      'A contract not governed by any framework agreement',
      'A framework agreement under which service schedules are signed',
      'A service schedule or order under a framework agreement',
      'Public or internal data without personal data',
      'Personal data or internal confidential data',
      'Special-category personal data, payment data or data under banking secrecy',
      'Degraded service, no customer impact within 72 hours',
      'Customer impact within 72 hours, recoverable',
      'Immediate customer or market impact, regulatory breach likely',
      'No alternative provider exists for the service',
      'Alternative exists; migration would exceed 12 months',
      'Alternative exists; migration within 3 to 12 months',
      'Alternative exists; migration within 3 months',
      'Service can be brought in-house within 3 months',
      'Service can be brought in-house within 12 months',
      'Service cannot realistically be brought in-house',
      'Loss of the service is absorbed by manual processes',
      'Loss of the service degrades a critical function',
      'Loss of the service stops a critical function',
    ]],
  )

  return registerFromStrings(
    {
      'B_01.01': b0101, 'B_01.02': b0102, 'B_01.03': b0103, 'B_02.01': b0201, 'B_02.02': b0202, 'B_02.03': b0203,
      'B_03.01': b0301, 'B_03.02': b0302, 'B_03.03': b0303, 'B_04.01': b0401, 'B_05.01': b0501, 'B_05.02': b0502,
      'B_06.01': b0601, 'B_07.01': b0701, 'B_99.01': b9901,
    },
    {
      kind: 'sample',
      zipName: SAMPLE_ZIP_NAME,
      root: SAMPLE_ZIP_NAME.replace(/\.zip$/, ''),
      parameters: { entityID: `rs:${E1}.CON`, refPeriod: REF_DATE, baseCurrency: 'iso4217:EUR', decimalsInteger: '0', decimalsMonetary: '0' },
      parametersHeader: ['name', 'value'],
      filingIndicators: Object.fromEntries(['B_01.01', 'B_01.02', 'B_01.03', 'B_02.01', 'B_02.02', 'B_02.03', 'B_03.01', 'B_03.02', 'B_03.03', 'B_04.01', 'B_05.01', 'B_05.02', 'B_06.01', 'B_07.01', 'B_99.01'].map((c) => [c, 'true'])),
      filingHeader: ['templateID', 'reported'],
      reportJsonExtends: 'http://www.eba.europa.eu/eu/fr/xbrl/crr/fws/dora/4.0/mod/dora.json',
    },
  )
}
