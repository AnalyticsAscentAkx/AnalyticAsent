import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { DRY_RUN_FAILURES, DRY_RUN_MISSING_BY_TEMPLATE, DRY_RUN_SOURCE } from '@/lib/dora/benchmark'
import { DOMAINS, TABLES, type Column, type Table } from '@/lib/dora/schema'
import { SITE_URL, pageMetadata } from '@/lib/site'
import { JoinDiagram } from './Diagram'

// The question this page answers is the one Google Suggest completes for
// "dora register of information": template, excel, data model, requirements,
// example. The vendor pages rank on it with an Excel starter and a copy of the
// Annex. None of them shows which columns are keys or how the fifteen tables
// join, which is the thing a rejected file is actually about. The taxonomy
// does, and we generate from it, so the field reference below is complete and
// checkable rather than retyped.
export const metadata = pageMetadata({
  title: 'DORA Register of Information templates explained',
  ogTitle: 'DORA Register of Information: what goes in each template, and how the tables link',
  description:
    'What goes in each DORA Register of Information template, B_01.01 to B_99.01: the key fields, the 22 foreign keys and why rule 807 rejects a file.',
  path: '/guides/dora-register-of-information-templates-explained',
  keywords: [
    'dora register of information template',
    'dora register of information data model',
    'dora register of information requirements',
    'dora register of information example',
    'eba dora register of information template',
    'ITS 2024/2956 templates',
    'B_02.02',
    'DORA error 807',
    'register of information foreign key',
  ],
})

const PATH = '/guides/dora-register-of-information-templates-explained'
const AS_OF = '18 October 2026'

// Primary sources, each fetched and read on 18 October 2026. Every date, rule
// text and placeholder convention on the page traces to one of these.
const SRC = {
  its: {
    name: 'Commission Implementing Regulation (EU) 2024/2956 of 29 November 2024 (ITS on the register of information), OJ L of 2 December 2024',
    url: 'https://eur-lex.europa.eu/eli/reg_impl/2024/2956/oj',
    date: '2 December 2024',
  },
  dora: {
    name: 'Regulation (EU) 2022/2554 (DORA), Article 28(3)',
    url: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
    date: '27 December 2022',
  },
  taxonomy: {
    name: 'EBA reporting framework 4.0: taxonomy package 4.0 errata 5 (DORA module 1.1.0)',
    url: 'https://www.eba.europa.eu/risk-and-data-analysis/reporting/reporting-frameworks/reporting-framework-40',
    date: '20 March 2025',
  },
  rules: {
    name: 'EBA, Overview of the RoI reporting technical checks and validation rules (xlsx)',
    url: 'https://www.eba.europa.eu/sites/default/files/2025-04/10100a51-275f-4c98-96a1-f81342a8f57d/Overview%20of%20the%20RoI%20reporting%20technical%20checks%20and%20validation%20rules%20%28updated%2028%20April%202025%29%20%284%29.xlsx',
    date: '28 April 2025',
  },
  faq: {
    name: 'ESAs, Frequently asked questions on reporting of the registers of information under DORA',
    url: 'https://www.eba.europa.eu/sites/default/files/2025-03/31bb6e60-7d10-4405-a8c5-9f04934630ac/20250328%20-%20DORA%20RoI%20reporting%20FAQ%20%28updated%29.pdf',
    date: '28 March 2025',
  },
  observations: {
    name: 'EBA, Observations from testing of RoI reporting to the ESAs: key common issues identified (slides)',
    url: 'https://eba.europa.eu/sites/default/files/2025-04/717e7e5f-14ac-45c6-b336-b0aac6a9062a/Observations%20from%20RoI%20reporting%20testing%20-%20common%20issues%20-%20April%202025%20%281%29.pdf',
    date: '16 April 2025, updated 16 May 2025',
  },
  dryRun: {
    name: 'ESAs, Dry Run exercise summary report (ESA 2024 35)',
    url: DRY_RUN_SOURCE.url,
    date: '17 December 2024',
  },
  decision: {
    name: 'ESAs Decision ESA 2024 22 on the reporting by competent authorities of information necessary for the designation of critical ICT third-party service providers',
    url: 'https://www.eiopa.europa.eu/publications/esas-decision-reporting-competent-authorities-esas-information-necessary-designation-critical-ict_en',
    date: '8 November 2024 (published 15 November 2024)',
  },
  csv: {
    name: 'EBA, Preparing plain csv reporting package for DORA (slides)',
    url: 'https://www.eba.europa.eu/sites/default/files/2025-01/1e5ffe22-64b2-4260-8fbf-8dcf095dfe4b/Preparing%20Plain%20csv%20reporting%20package%20for%20DORA.pdf',
    date: 'January 2025',
  },
  dnb: {
    name: 'De Nederlandsche Bank, DORA reporting: registers of information in March 2026',
    url: 'https://www.dnb.nl/en/sector-news/supervision-2026/q1/dora-reporting-dora-registers-of-information-in-march-2026/',
    date: '3 February 2026',
  },
  cssf: {
    name: 'CSSF, DORA: submission timeframe for the register of information, eDesk open as of 11 February 2026',
    url: 'https://www.cssf.lu/en/2026/02/dora-submission-timeframe-for-register-of-information-edesk-portal-open-as-of-11-february-2026/',
    date: 'February 2026',
  },
}

function Cite({ s, label }: { s: { url: string; date: string }; label: string }) {
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[var(--blue-light)] hover:underline">
      {label}
    </a>
  )
}

// What one row of each template stands for. The taxonomy gives the key
// columns; what a row *means* is in Annex I of the ITS, read and condensed.
const ROW_MEANING: Record<string, string> = {
  'B_01.01': 'The entity submitting the register. One row.',
  'B_01.02': 'Every entity the register covers: the reporting entity, each subsidiary and parent in scope, and any intra-group ICT provider. One row per entity.',
  'B_01.03': 'Branches of those entities located outside their home country. One row per branch. Empty, but still filed, when there are none.',
  'B_02.01': 'Each contractual arrangement once: its type, its overarching (master) arrangement if any, and the annual expense. One row per contract.',
  'B_02.02': 'The detail: which entity uses which ICT service, from which provider, for which function, under which contract, with dates, notice periods, governing law and data locations. One row per contract, entity, provider, function, service type and location combination.',
  'B_02.03': 'Pairs of linked intra-group arrangements. One row per link.',
  'B_03.01': 'Who signed each contract on the receiving side. One row per contract and signing entity.',
  'B_03.02': 'Which provider signed each contract. One row per contract and signing provider.',
  'B_03.03': 'Entities in scope that provide ICT services to others in the group under a contract. One row per contract and providing entity.',
  'B_04.01': 'Every entity, and every branch, that makes use of each contract. One row per contract, entity and branch.',
  'B_05.01': 'Every ICT third-party provider the register mentions, including subcontractors and ultimate parents, with identifier, name, country and total annual expense. One row per provider.',
  'B_05.02': 'The supply chain behind each service: the direct provider at rank 1, each subcontractor at rank 2 and below, and who subcontracted to whom. One row per contract, service type, provider, rank and recipient.',
  'B_06.01': 'The business functions ICT services support, per entity, with the criticality assessment, its date, recovery objectives and the impact of losing the function. One row per function and entity.',
  'B_07.01': 'The assessment of each ICT service supporting a critical or important function: substitutability, exit plan, reintegration, last audit, alternatives. One row per contract, provider and service type.',
  'B_99.01': 'The entity’s own definitions of the scales used elsewhere (low, medium, high; substitutable, not substitutable; and so on). Free text, no key.',
}

// Column-level notes from the ITS instructions and the ESAs FAQ, only where
// the instruction is something the column label does not say. Cited in place.
const NOTES: Record<string, string> = {
  'B_01.01.c0010': '20-character ISO 17442 LEI of the entity filing the register (ITS Annex I).',
  'B_01.02.c0040': 'The same 22 types as B_01.01 plus two non-financial options: ICT intra-group service provider, and other non-financial entity (taxonomy list CT24).',
  'B_01.02.c0050': 'Five options; an entity that fits more than one takes the higher level, for example parent other than ultimate parent over subsidiary (FAQ Q100).',
  'B_01.02.c0060': 'Refers to c0010 of this table (R6): the parent must have its own row. An entity with no direct parent, such as the ultimate parent itself, repeats its own LEI from c0010 (FAQ Q58).',
  'B_01.02.c0090': '9999-12-31 when the entity has not been deleted (ITS Annex I).',
  'B_01.03.c0010': 'The branch’s own LEI if it has one, otherwise the code the entity uses for it (ITS Annex I).',
  'B_01.03.c0020': 'Must match an LEI in B_01.02 (R3).',
  'B_02.01.c0010': 'Assigned by the entity. The ITS requires it to be unique and consistent over time at entity, sub-consolidated and consolidated level, and used identically in every template.',
  'B_02.01.c0020': 'Standalone, overarching (master or framework), or subsequent/associated to an overarching one.',
  'B_02.01.c0030': 'Refers to c0010 of this table (R13). When the contract is itself overarching or standalone the FAQ says to type “Not applicable”, because the field cannot be left blank and there is no list value for it (FAQ Q124). “Not applicable” is not a contract reference, so an engine applying R13 literally would not find it in c0010; neither the FAQ nor the rules workbook says how the EBA engine treats it.',
  'B_02.01.c0050': 'In units, not thousands (ITS); the currency goes in c0040. A plain number, not text (rule 305).',
  'B_02.02.c0010': '“As reported in B_02.01.0010” (ITS). The taxonomy checks it together with c0030 against B_03.02 (R17), not against B_02.01 directly.',
  'B_02.02.c0020': '“As reported in B_04.01.0020” (ITS). Checked together with c0050 against B_06.01 (R7).',
  'B_02.02.c0030': 'The provider’s code as in B_05.01.0010. Checked with c0010 against B_03.02 (R17); the chain B_02.02 → B_03.02 → B_05.01 is what ties a service to its provider.',
  'B_02.02.c0050': 'Letter F followed by a natural number, as defined by the entity in B_06.01.0010 (ITS). Checked with c0020 against B_06.01 (R7).',
  'B_02.02.c0080': 'The end date in the contract; 9999-12-31 where the arrangement is indefinite; the renewal date where it renews; the termination date where it was ended early (ITS). Expired or terminated contracts are not included in the register, so c0090 normally stays empty (FAQ Q52). The rule that end must follow start (v8816_m) was deactivated in March 2025.',
  'B_02.02.c0100': 'Mandatory if the service supports a critical or important function (ITS).',
  'B_02.02.c0110': 'Mandatory if the service supports a critical or important function (ITS).',
  'B_02.02.c0120': 'Mandatory if the service supports a critical or important function (ITS).',
  'B_02.02.c0130': 'Key column, so it cannot be blank. eba_GA:qx2007 (Not applicable) when the service does not support a critical or important function (FAQ Q59).',
  'B_02.02.c0150': 'Key column. eba_GA:qx2007 when c0140 is No (FAQ Q61).',
  'B_02.02.c0160': 'Key column. eba_GA:qx2007 when the service involves no data processing (FAQ Q63).',
  'B_02.02.c0170': 'Low, medium or high; the most sensitive data present decides (ITS).',
  'B_02.03.c0010': 'Must exist in B_02.01 (R11).',
  'B_02.03.c0020': 'Must exist in B_02.01 (R12).',
  'B_03.01.c0020': 'LEI, or EUID for an EU entity. The signatory need not be a financial entity nor the one using the service (ITS). Must exist in B_01.02 (R2).',
  'B_03.02.c0020': 'Must exist in B_05.01 (R19).',
  'B_03.03.c0020': 'Must exist in B_01.02 (R1).',
  'B_04.01.c0020': 'Must exist in B_01.02 (R4).',
  'B_04.01.c0040': 'Key column. Type “Not Applicable” when the entity is not a branch (FAQ Q64); otherwise the branch code from B_01.03. The taxonomy declares no foreign key to B_01.03 for it.',
  'B_05.01.c0010': 'For a legal person, a valid LEI or EUID, and both where available (ITS Article 3(5)); a provider established outside the EU is identified by LEI only (ITS recital 9). Where none exists for a third-country provider the FAQ says to fill the field with another identifier rather than leave it blank; it is flagged, not rejected (FAQ Q40).',
  'B_05.01.c0070': 'Legal person, or individual acting in a business capacity. The rule tying legal persons to LEI or EUID (v8817_m) was deactivated in March 2025.',
  'B_05.01.c0100': 'Mandatory only for direct providers, rank 1 in B_05.02 (ITS).',
  'B_05.01.c0110': 'Refers to c0010 of this table (R18), so the parent needs its own row. When the provider has no parent, repeat its own code here (ITS). Report the highest-level parent; the model cannot hold two (FAQ Q119).',
  'B_05.02.c0050': 'The direct provider is always rank 1 (ITS Article 2); rank 2 and above are subcontractors.',
  'B_05.02.c0060': 'At rank n, the rank n−1 provider that subcontracted the service. The ITS says to leave it blank at rank 1, but the column is a key, so the FAQ says to repeat the provider code from c0030 at rank 1 (FAQ Q65). Must exist in B_05.01 (R21), which the repeated code does.',
  'B_06.01.c0010': 'Letter F followed by a natural number; one identifier per combination of LEI, licensed activity and function (ITS).',
  'B_06.01.c0040': 'Must exist in B_01.02 (R5).',
  'B_06.01.c0050': 'Numbered B_06.01.0060 in the ITS. The ITS has no 0050 in this template, so from here on each ITS field number is one higher than the taxonomy column: ITS 0060 is c0050, 0080 is c0070, 0090 (recovery time) is c0080, 0100 (recovery point) is c0090, 0110 is c0100. The FAQ uses the ITS numbers (Q59 refers to B_06.01.0060); the CSV header uses the taxonomy codes.',
  'B_06.01.c0070': '9999-12-31 when the assessment has not been performed (ITS B_06.01.0080).',
  'B_06.01.c0080': 'Hours. “1” when under an hour; “0” when no objective is defined (ITS B_06.01.0090).',
  'B_06.01.c0090': 'Hours. “1” when under an hour; “0” when no objective is defined (ITS B_06.01.0100).',
  'B_07.01.c0010': 'Only for arrangements supporting a critical or important function (ITS). Must exist in B_02.01 (R15).',
  'B_07.01.c0020': 'Must exist in B_05.01 (R22).',
  'B_07.01.c0070': '9999-12-31 where no audit has been performed (ITS).',
}

const TYPE_LABEL: Record<Column['type'], string> = {
  s: 'text',
  e: 'closed list',
  d: 'date yyyy-mm-dd',
  i: 'integer',
  m: 'amount',
  t: 'true',
}

function refsFor(t: Table, code: string) {
  return t.references.filter((r) => r.columns.includes(code)).map((r) => ({ to: r.table, id: r.name.split(/\s+/)[0].replace(/_.*$/, '') }))
}

function refList(t: Table) {
  const seen = new Set<string>()
  return t.references
    .map((r) => r.table)
    .filter((x) => (seen.has(x) ? false : (seen.add(x), true)))
}

const FK_COUNT = TABLES.reduce((n, t) => n + t.references.length, 0)
const COL_COUNT = TABLES.reduce((n, t) => n + t.columns.length, 0)
const KEY_COUNT = TABLES.reduce((n, t) => n + t.primary.length, 0)

// The order in which the keys resolve: a table is listed only after every
// table it refers to. Filling, and fixing, in this order means each 807 is
// found once, at the row that caused it.
const FILL_ORDER = ['B_01.01', 'B_01.02', 'B_01.03', 'B_06.01', 'B_05.01', 'B_02.01', 'B_02.03', 'B_03.01', 'B_03.02', 'B_03.03', 'B_04.01', 'B_05.02', 'B_07.01', 'B_02.02', 'B_99.01']

// A one-contract register, key columns only. The LEIs are the EBA's own
// placeholder pattern from its file-naming example, so nobody mistakes them
// for real codes; everything else is what the templates ask for.
const EX = {
  bank: 'DUMMYLEI123456789012',
  cloud: 'DUMMYLEI0000000CLOUD',
  parent: 'DUMMYLEI00000000PRNT',
  contract: 'CA-2025-017',
  fn: 'F1',
}

const EXAMPLE: { table: string; rows: string[][]; cols: string[]; note?: string }[] = [
  { table: 'B_01.01', cols: ['c0010', 'c0030', 'c0040'], rows: [[EX.bank, 'eba_GA:NL', 'eba_CT:x12']] },
  { table: 'B_01.02', cols: ['c0010', 'c0050', 'c0060'], rows: [[EX.bank, 'eba_RP:x53', EX.bank]], note: 'An ultimate parent has no direct parent, so c0060 repeats its own LEI (FAQ Q58), and R6 finds it in c0010 of the same row.' },
  { table: 'B_01.03', cols: ['c0010', 'c0020'], rows: [], note: 'No branches outside the home country. The file b_01.03.csv is still in the package with its header row (FAQ Q76).' },
  { table: 'B_06.01', cols: ['c0010', 'c0040', 'c0050'], rows: [[EX.fn, EX.bank, 'eba_BT:x28']], note: 'Key is (c0010, c0040): F1 is unique per entity, not per register. R5 needs the LEI in B_01.02.' },
  { table: 'B_05.01', cols: ['c0010', 'c0020', 'c0110', 'c0120'], rows: [[EX.cloud, 'eba_qCO:qx2000', EX.parent, 'eba_qCO:qx2000'], [EX.parent, 'eba_qCO:qx2000', EX.parent, 'eba_qCO:qx2000']], note: 'Two rows for one contract: the provider, and its ultimate parent, which must exist as a row because c0110 refers to c0010 (R18). The parent repeats its own code in c0110.' },
  { table: 'B_02.01', cols: ['c0010', 'c0020', 'c0030'], rows: [[EX.contract, 'eba_CO:x1', 'Not applicable']], note: 'Standalone, so there is no overarching arrangement; the FAQ says to type “Not applicable” into c0030 (Q124). This is the one cell in the example whose treatment by R13 the published sources do not settle; see the field reference.' },
  { table: 'B_03.01', cols: ['c0010', 'c0020', 'c0030'], rows: [[EX.contract, EX.bank, 'true']], note: 'R10 needs the contract in B_02.01; R2 needs the LEI in B_01.02.' },
  { table: 'B_03.02', cols: ['c0010', 'c0020', 'c0030'], rows: [[EX.contract, EX.cloud, 'eba_qCO:qx2000']], note: 'R9 needs the contract in B_02.01; R19 needs the provider in B_05.01. This row is also what B_02.02 points at.' },
  { table: 'B_03.03', cols: ['c0010', 'c0020'], rows: [], note: 'No intra-group provider. Empty file, still in the package.' },
  { table: 'B_04.01', cols: ['c0010', 'c0020', 'c0030', 'c0040'], rows: [[EX.contract, EX.bank, 'eba_ZZ:x839', 'Not Applicable']], note: 'c0040 is a key column and the entity is not a branch, so the FAQ’s typed “Not Applicable” goes in (Q64).' },
  { table: 'B_02.02', cols: ['c0010', 'c0020', 'c0030', 'c0050', 'c0060', 'c0130', 'c0150', 'c0160'], rows: [[EX.contract, EX.bank, EX.cloud, EX.fn, 'eba_TA:S19', 'eba_GA:NL', 'eba_GA:IE', 'eba_GA:IE']], note: 'Eight key columns. R17 looks up (c0010, c0030) in B_03.02; R7 looks up (c0050, c0020) in B_06.01. Three country columns are keys, which is why the FAQ added “Not applicable” to their list.' },
  { table: 'B_05.02', cols: ['c0010', 'c0020', 'c0030', 'c0050', 'c0060'], rows: [[EX.contract, 'eba_TA:S19', EX.cloud, '1', EX.cloud]], note: 'Rank 1, so there is no recipient of subcontracted services. c0060 is a key and cannot be blank, so it repeats the provider code from c0030 (FAQ Q65), which also satisfies R21.' },
  { table: 'B_07.01', cols: ['c0010', 'c0020', 'c0030', 'c0040', 'c0050'], rows: [[EX.contract, EX.cloud, 'eba_qCO:qx2000', 'eba_TA:S19', 'eba_ZZ:x961']], note: 'Present because F1 is critical. R15 needs the contract in B_02.01; R22 needs the provider in B_05.01.' },
  { table: 'B_99.01', cols: ['c0010', 'c0040'], rows: [['A contract with one provider that is not tied to a master agreement', 'Data whose loss would not harm clients or the entity']], note: 'One row of the entity’s own definitions; no key, so nothing checks it beyond type.' },
]

const FAQ = [
  {
    q: 'What are the fifteen DORA Register of Information templates?',
    a: 'Annex I of Commission Implementing Regulation (EU) 2024/2956 defines fifteen templates. B_01.01 to B_01.03 describe the reporting entity, the entities in scope and their branches. B_02.01 to B_02.03 describe each contractual arrangement in general, in detail per service, and the links between intra-group arrangements. B_03.01 to B_03.03 record who signed each contract on the receiving and providing sides. B_04.01 lists the entities and branches using each contract. B_05.01 lists every ICT third-party provider with its ultimate parent, and B_05.02 the supply chain of subcontractors by rank. B_06.01 lists business functions with their criticality assessment, B_07.01 the assessment of each ICT service supporting a critical or important function, and B_99.01 the entity’s own definitions of the scales it used.',
  },
  {
    q: 'Which fields in the register of information are primary keys?',
    a: `The EBA data model marks ${KEY_COUNT} of the ${COL_COUNT} columns as keys. Single-column keys: the LEI in B_01.01 and B_01.02, the contract reference in B_02.01, the provider code in B_05.01. Composite keys: branch code plus head-office LEI in B_01.03; the two linked contract references in B_02.03; contract plus entity or provider in B_03.01, B_03.02 and B_03.03; contract, entity and branch in B_04.01; contract, service type, provider, rank and recipient in B_05.02; function identifier plus LEI in B_06.01; contract, provider and service type in B_07.01; and eight columns in B_02.02, including the three country-of-service and data-location columns. B_99.01 has no key. A key column cannot be empty (rule 805) and a key tuple cannot repeat (rule 806).`,
  },
  {
    q: 'What does DORA error 807 mean and how do I fix it?',
    a: 'Rule 807 is the EBA’s foreign-key check: “The reported data must follow the key-foreign key contraints [sic] defined in the DPM”. A value in one template must exist as a key in the template it refers to. The taxonomy declares 22 such references. Typical cases are an ultimate parent code in B_05.01 column c0110 with no row of its own in B_05.01, a contract used in B_02.03, B_03.01 to B_03.03, B_04.01, B_05.02 or B_07.01 that is missing from B_02.01 (the EBA’s own example is a B_07.01 contract reference not found in B_02.01), a contract and provider pair in B_02.02 with no matching row in B_03.02, and a function identifier in B_02.02 that is not defined for the same entity in B_06.01. Fix the defining table first, in the order B_01.02, B_05.01, B_02.01, B_03.02 and B_06.01, then B_02.02, and check that every CSV parsed, because the EBA notes that when a table cannot be integrated many foreign keys referring to it fail with 807.',
  },
  {
    q: 'How do B_02.02, B_03.02 and B_05.01 relate to each other?',
    a: 'B_05.01 defines each provider once with its identification code. B_03.02 records which provider signed which contract, keyed on contract reference plus provider code, and refers to B_05.01 for the code. B_02.02 then describes each service under the contract and refers to B_03.02 for the pair of contract reference and provider code. So the taxonomy does not check B_02.02 against B_05.01 or B_02.01 directly: a service row is valid only if the same contract and provider pair appears in B_03.02, and that pair is valid only if the contract exists in B_02.01 and the provider in B_05.01.',
  },
  {
    q: 'Do empty templates have to be included in the register of information file?',
    a: 'They have to be declared. The ESAs’ FAQ says that an entity with no branches does not fill B_01.03 but the empty template still needs to be reported (Q76). The EBA’s April 2025 observations say all DORA templates must be reported, every template must be declared as true in FilingIndicators.csv (rule 808 rejects a missing or false declaration), and a template can be reported empty when there is nothing to report. Since the May 2025 rule changes a missing or empty table file is accepted, but a package in which every table is empty fails rule 724. The simplest safe package declares all fifteen and includes all fifteen CSV files, empty ones with just their header row.',
  },
  {
    q: 'Is there an official Excel template for the DORA register of information?',
    a: 'The ESAs provided an Excel template and a CSV conversion tool for the 2024 dry run only. Their FAQ of 28 March 2025 says those tools were based on the draft ITS and the draft data model, and that the ESAs did not plan to update and maintain the conversion tool for official reporting (Q2); it adds that, given the referential integrity the data model imposes, the ESAs are not in a position to create an Excel solution that would pass the validation rules (Q21). The format reported to the ESAs is the plain-CSV package defined by the EBA taxonomy. Some national authorities accept a workbook of their own and convert it: DNB says it converts its Excel template to the xBRL-CSV standard. The ESAs’ checks then run on the converted package, so the keys and closed lists described here apply either way.',
  },
]

function ColumnRow({ t, c }: { t: Table; c: Column }) {
  const key = t.primary.includes(c.code)
  const refs = refsFor(t, c.code)
  const note = NOTES[`${t.code}.${c.code}`]
  const domainSize = c.domain ? Object.keys(DOMAINS[c.domain] ?? {}).length : 0
  return (
    <tr className="border-t border-[var(--line)] align-top">
      <td className="py-2 pr-3 font-mono text-xs text-white">{c.code}</td>
      <td className="py-2 pr-3 text-sm text-[var(--text)]">
        {c.label}
        {note ? <span className="mt-1 block text-xs leading-5 text-[var(--text-dim)]">{note}</span> : null}
      </td>
      <td className="py-2 pr-3 text-xs text-[var(--text-dim)] whitespace-nowrap">
        {TYPE_LABEL[c.type]}
        {c.domain ? <span className="block font-mono text-[var(--text-faint)]">{c.domain} · {domainSize}</span> : null}
      </td>
      <td className="py-2 text-xs whitespace-nowrap">
        {key ? <span className="rounded-full border border-[var(--blue)] px-2 py-0.5 font-semibold text-[var(--blue-light)]">key</span> : null}
        {refs.map((r) => (
          <span key={r.id} className="mt-1 block font-mono text-[var(--text-dim)]">
            {r.id} → <a href={`#${r.to}`} className="text-[var(--blue-light)] hover:underline">{r.to}</a>
          </span>
        ))}
      </td>
    </tr>
  )
}

function SmallList({ domain }: { domain: string }) {
  const members = DOMAINS[domain]
  return (
    <div className="border-t border-[var(--line)] pt-4">
      <p className="font-mono text-sm font-semibold text-white">{domain}</p>
      <ul className="mt-2 space-y-1">
        {Object.entries(members).map(([code, label]) => (
          <li key={code} className="text-xs leading-5 text-[var(--text-dim)]">
            <span className="font-mono text-[var(--text)]">{code}</span> {label}
          </li>
        ))}
      </ul>
    </div>
  )
}

const SMALL_DOMAINS = ['CO3', 'qCO6', 'TA19', 'CO6', 'RP5', 'CT2', 'ZZ2', 'BT2', 'BT3', 'ZZ3', 'ZZ4', 'ZZ4_2', 'ZZ4_3', 'ZZ3_2', 'ZZ4_4']
const LARGE_DOMAINS: [string, string][] = [
  ['GA251', 'ISO 3166 country codes, used for the country of an entity, a branch, a provider’s headquarters and the governing law.'],
  ['GA252', 'The same 251 countries plus eba_GA:qx2007 “Not applicable”, used only for the three key columns in B_02.02: country of provision, data at rest, data management.'],
  ['CU166', 'ISO 4217 currency codes.'],
  ['CT22', 'The 22 types of financial entity for B_01.01.'],
  ['CT24', 'The same 22 plus two non-financial types for B_01.02.'],
  ['TA131', 'Licensed activities for B_06.01, across banking, insurance, investment, payments and market infrastructure.'],
]

export default function DoraTemplatesGuide() {
  const article = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'DORA Register of Information templates explained: fields, keys and how the tables link',
    description: metadata.description,
    url: `${SITE_URL}${PATH}`,
    mainEntityOfPage: `${SITE_URL}${PATH}`,
    datePublished: '2026-10-18',
    dateModified: '2026-10-18',
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}/#organization` },
    author: { '@id': `${SITE_URL}/#organization` },
    about: ['DORA register of information', 'Implementing Regulation (EU) 2024/2956', 'EBA DORA taxonomy'],
  }

  return (
    <RootLayout>
      <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'DORA Register of Information templates explained', path: PATH }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <PageIntro eyebrow="Guide · DORA Register of Information" title="What goes in each DORA Register of Information template, and how the tables link">
        <p>
          The DORA Register of Information is fifteen linked tables, B_01.01 to B_99.01, set by Annex I of
          Implementing Regulation (EU) 2024/2956. Four of them define identifiers: B_01.02 the entities, B_05.01
          the providers, B_02.01 the contracts, B_06.01 the business functions. Nine others refer to those by
          key: an LEI, a provider code, a contract reference, a function identifier. B_01.01 and B_99.01 refer
          to nothing. The EBA data model marks {KEY_COUNT} of the {COL_COUNT} columns as keys
          and declares {FK_COUNT} references between tables. A file is rejected when a key is empty (rule 805),
          repeated (806) or points at a row that does not exist (807). This page lists every column, every key
          and every link, generated from the EBA taxonomy, and walks through a one-contract example across all fifteen files.
        </p>
      </PageIntro>

      <Container className="mt-12 sm:mt-16">
        <FadeIn>
          <p className="max-w-3xl text-sm leading-6 text-[var(--text-faint)]">
            Sources, each read on {AS_OF}: the <Cite s={SRC.its} label="ITS text on EUR-Lex" /> (OJ L, 2 December 2024),
            the <Cite s={SRC.taxonomy} label="EBA taxonomy package 4.0" /> (errata 5, 20 March 2025, DORA module 1.1.0),
            the <Cite s={SRC.rules} label="EBA validation rules workbook" /> (28 April 2025), the{' '}
            <Cite s={SRC.faq} label="ESAs reporting FAQ" /> (28 March 2025) and the{' '}
            <Cite s={SRC.observations} label="EBA observations from the 2025 testing" /> (April 2025). The full list is at the end.
          </p>
        </FadeIn>
      </Container>

      {/* ---- The fifteen templates ------------------------------------- */}
      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">The fifteen templates, and what one row means</h2>
          <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
            Article 4 of the ITS says each template is “a table with a predefined number of columns and an
            indefinite number of rows”. The columns are fixed by the taxonomy; what a row stands for is in the
            Annex I instructions. Both are condensed here.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[var(--text-faint)]">
                  <th className="py-2 pr-3 font-semibold">Template</th>
                  <th className="py-2 pr-3 font-semibold">One row is</th>
                  <th className="py-2 pr-3 font-semibold">Key columns</th>
                  <th className="py-2 font-semibold">Refers to</th>
                </tr>
              </thead>
              <tbody>
                {TABLES.map((t) => (
                  <tr key={t.code} className="border-t border-[var(--line)] align-top">
                    <td className="py-3 pr-3">
                      <a href={`#${t.code}`} className="font-mono text-sm font-semibold text-white hover:text-[var(--blue-light)]">{t.code}</a>
                      <span className="mt-1 block text-xs text-[var(--text-faint)]">{t.label}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm leading-6 text-[var(--text-dim)]">{ROW_MEANING[t.code]}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-[var(--text)]">{t.primary.length ? t.primary.join(', ') : '—'}</td>
                    <td className="py-3 font-mono text-xs text-[var(--text-dim)]">{refList(t).length ? refList(t).join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </Container>

      {/* ---- The join graph --------------------------------------------- */}
      <div className="section-lift mt-20 py-20 sm:mt-28 sm:py-24">
        <Container>
          <FadeIn>
            <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">How the tables link</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              The taxonomy declares {FK_COUNT} references. Each is a column, or a pair of columns, in one table
              that must match the key of another. The EBA engine enforces every one of them as rule 807, and the
              reference number in the message, R1 to R22, is the label on the arrow.
            </p>
            <JoinDiagram />
            <div className="mt-10 grid gap-10 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Read the graph in three layers</h3>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-dim)]">
                  <li>
                    <span className="font-semibold text-white">Defining tables.</span> B_01.02 defines every LEI,
                    B_05.01 every provider code, B_02.01 every contract reference. Each also refers to itself: a
                    parent LEI (R6), an ultimate parent code (R18) and an overarching contract (R13) must be rows in
                    the same table.
                  </li>
                  <li>
                    <span className="font-semibold text-white">Link tables.</span> B_03.01, B_03.02, B_03.03 and
                    B_04.01 each pair a contract with an entity or provider, and B_06.01 pairs a function with an
                    entity. They refer to the defining tables and nothing else.
                  </li>
                  <li>
                    <span className="font-semibold text-white">Detail tables.</span> B_02.02 refers to B_03.02
                    (contract and provider, R17) and to B_06.01 (function and entity, R7). B_05.02 and B_07.01
                    refer to B_02.01 and B_05.01. B_02.03 refers to B_02.01 twice.
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Two things the diagram shows that the Annex does not</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-dim)]">
                  <li>
                    <span className="font-semibold text-white">B_02.02 has no direct link to B_02.01 or B_05.01.</span>{' '}
                    The Annex says its contract reference is “as reported in B_02.01.0010”, but the check the
                    engine runs is R17: the pair of contract and provider must exist in B_03.02. A contract that is
                    in B_02.01 but has no signing-provider row fails on every B_02.02 row, and the error is reported
                    against B_02.02, not against the table where the row is missing.
                  </li>
                  <li>
                    <span className="font-semibold text-white">B_04.01’s branch code has no foreign key.</span> The
                    Annex says to use the code from B_01.03.0010, but no reference is declared, so a mismatch passes
                    the engine. The column is still a key, which is why the FAQ has filers type “Not Applicable” into
                    it rather than leave it blank (FAQ Q64).
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6">
              <p className="font-display font-semibold text-white">The order in which the keys resolve</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                Every table appears after the tables it refers to. Fill in this order and each row can be checked as
                it is written; fix in this order and each 807 is found once, at its cause.
              </p>
              <p className="mt-3 font-mono text-sm text-[var(--text)]">{FILL_ORDER.join(' → ')}</p>
            </div>
          </FadeIn>
        </Container>
      </div>

      {/* ---- Keys and the three rules ------------------------------------ */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">Which fields are keys, and the three rules that check them</h2>
          <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
            The EBA’s <Cite s={SRC.rules} label="validation rules workbook" /> (28 April 2025) describes the three
            key rules in one line each, all three in its “Additional Plain-csv” category. The EBA’s{' '}
            <Cite s={SRC.observations} label="April 2025 observations" /> mark 805 and 807 as leading to
            rejection. For 806 its summary table says no, while its own 806 slide says a repeated key “will be
            rejected with 806”; treat it as blocking.
          </p>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ['805', '“For open tables, the key columns values cannot be empty”', 'Every key column listed in the reference below must hold a value in every row. Where the ITS has nothing to put there, the FAQ supplies a value: “Not Applicable” typed into B_04.01.c0040 (Q64), eba_GA:qx2007 in the three B_02.02 country keys (Q59, Q61, Q63), the provider’s own code in B_05.02.c0060 at rank 1 (Q65), and “Not Applicable” in any other key field that cannot be filled (Q26). The EBA’s April 2025 observations illustrate 805 with missing c0010 values.'],
              ['806', '“For open tables, you cannot have multiple rows with identical key values”', 'The key is the whole tuple. B_02.02 has eight key columns, so two rows for the same contract, entity, provider, function and service type are duplicates only if the three country columns also match. One provider listed twice in B_05.01, or one contract twice in B_02.01, is the simple case.'],
              ['807', '“The reported data must follow the key-foreign key contraints [sic] defined in the DPM”', 'The 22 references on the diagram. The EBA’s worked example of a self-reference failure is a c0030 value “not in any row for C 0010”, which in the taxonomy is R13 in B_02.01. Its cross-table example is a contract reference in B_07.01 that is not found in B_02.01.'],
            ].map(([code, quote, text]) => (
              <div key={code} className="rule-fade pt-5">
                <dt className="stat font-display text-3xl font-medium">{code}</dt>
                <dd className="mt-2 text-sm italic leading-6 text-[var(--text)]">{quote}</dd>
                <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{text}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">
            One rule sits in front of these. Rule 809, “CSV formatting problem detected”, was added in May 2025
            because, in the EBA’s words, if a table cannot be integrated “many foreign keys will fail with 807”,
            and without the new rule “it is hard for the submitters to understand the reason for the 807”
            (<Cite s={SRC.rules} label="workbook" />, <Cite s={SRC.observations} label="observations" />). A row
            with an extra or missing comma in b_05.01.csv can therefore surface as 807 messages on every table that
            refers to B_05.01: B_03.02, B_05.02, B_07.01, and B_05.01 itself through R18. Read the 809 and UTF-8
            (306) messages first.
          </p>
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-6">
            <p className="text-[var(--text)]">
              The checks above run on your register, in your browser, and each 807 in the output names the
              reference (R1 to R22), the row and the table that should hold the missing key.
            </p>
            <Link href="/dora-register" className="mt-4 inline-flex items-center rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)]">
              Check a register against these rules
            </Link>
          </div>
        </FadeIn>
      </Container>

      {/* ---- Field reference ---------------------------------------------- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">Field reference, template by template</h2>
          <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
            All {COL_COUNT} columns from the EBA taxonomy, with their type, the closed list they draw from and its
            size, whether they are part of the key, and which table they refer to. The notes are the instructions
            from Annex I of the ITS and the ESAs FAQ that the column label does not already say. Types map to
            rules: dates must be yyyy-mm-dd (330), amounts plain numbers (305), closed-list values one of the
            listed codes with the eba_ prefix (503), link columns the word true.
          </p>
        </FadeIn>
        <div className="mt-10 space-y-12">
          {TABLES.map((t) => (
            <FadeIn key={t.code}>
              <section id={t.code} className="scroll-mt-24 border-t border-[var(--line)] pt-6">
                <h3 className="font-display text-xl font-semibold text-white">
                  <span className="font-mono">{t.code}</span> <span className="text-[var(--text-dim)]">·</span> {t.label}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{ROW_MEANING[t.code]}</p>
                <p className="mt-2 font-mono text-xs text-[var(--text-faint)]">
                  file {t.file}.csv · key {t.primary.length ? t.primary.join(' + ') : 'none'} · {t.references.length ? `refers to ${refList(t).join(', ')}` : 'no references'}
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-[var(--text-faint)]">
                        <th className="py-2 pr-3 font-semibold">Column</th>
                        <th className="py-2 pr-3 font-semibold">Field</th>
                        <th className="py-2 pr-3 font-semibold">Type · list</th>
                        <th className="py-2 font-semibold">Key · refers to</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.columns.map((c) => (
                        <ColumnRow key={c.code} t={t} c={c} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </FadeIn>
          ))}
        </div>
      </Container>

      {/* ---- Closed lists --------------------------------------------------- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">The closed lists</h2>
          <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
            {Object.keys(DOMAINS).length} lists in the taxonomy. A cell drawn from one must contain the code exactly,
            prefix included: eba_TA:S19, not S19 and not “Cloud services: SaaS” (rule 503). The six large lists are
            summarised; the rest are printed in full.
          </p>
          <ul className="mt-6 space-y-3">
            {LARGE_DOMAINS.map(([d, what]) => (
              <li key={d} className="text-sm leading-6 text-[var(--text-dim)]">
                <span className="font-mono font-semibold text-white">{d}</span>{' '}
                <span className="text-[var(--text-faint)]">({Object.keys(DOMAINS[d]).length} values)</span> {what}
              </li>
            ))}
          </ul>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {SMALL_DOMAINS.map((d) => (
              <SmallList key={d} domain={d} />
            ))}
          </div>
        </FadeIn>
      </Container>

      {/* ---- Worked example ------------------------------------------------ */}
      <div className="section-lift mt-20 py-20 sm:mt-28 sm:py-24">
        <Container>
          <FadeIn>
            <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">Worked example: one contract, fifteen files</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              A credit institution in the Netherlands with one SaaS contract, supporting one critical function, from
              one provider that belongs to a group. Key and reference columns only; the other columns are filled as
              the field reference describes. The LEIs follow the DUMMYLEI pattern the ESAs use in their own
              file-naming example (FAQ Q24), so they are visibly placeholders.
            </p>
            <div className="mt-8 space-y-6">
              {EXAMPLE.map((e) => (
                <div key={e.table} className="rule-fade pt-4">
                  <p className="font-mono text-sm font-semibold text-white">
                    {e.table} <span className="font-sans font-normal text-[var(--text-faint)]">· {e.rows.length} {e.rows.length === 1 ? 'row' : 'rows'}</span>
                  </p>
                  {e.rows.length > 0 ? (
                    <div className="mt-2 overflow-x-auto">
                      <table className="border-collapse text-left font-mono text-xs">
                        <thead>
                          <tr className="text-[var(--text-faint)]">
                            {e.cols.map((c) => (
                              <th key={c} className="py-1 pr-5 font-normal">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {e.rows.map((r, i) => (
                            <tr key={i} className="text-[var(--text)]">
                              {r.map((v, j) => (
                                <td key={j} className="py-1 pr-5 whitespace-nowrap">{v}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {e.note ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{e.note}</p> : null}
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6">
              <p className="font-display font-semibold text-white">Three edits that each break it</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--text-dim)]">
                <li>Delete the second B_05.01 row. The first row’s c0110 now points at nothing: 807 on R18, reported against B_05.01.</li>
                <li>Change F1 to F2 in B_02.02. No (F2, {EX.bank}) pair exists in B_06.01: 807 on R7, reported against B_02.02.</li>
                <li>Delete the B_03.02 row. The contract still exists in B_02.01, but B_02.02 looks for ({EX.contract}, {EX.cloud}) in B_03.02: 807 on R17, reported against B_02.02, which is the wrong place to look for the cause.</li>
              </ul>
            </div>
          </FadeIn>
        </Container>
      </div>

      {/* ---- Consequences ------------------------------------------------- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">What happens if you get it wrong</h2>
          <div className="mt-6 grid gap-10 lg:grid-cols-2">
            <div className="space-y-4 text-[var(--text-dim)]">
              <p>
                The ESAs’ FAQ describes three layers: technical checks, DPM validation and business checks. A
                submission that fails the technical layer is rejected and returned with feedback. The EBA’s April
                2025 observations list which common errors lead to rejection: 807, 805, 808, 720, 714, 103 and 801
                do; missing mandatory values (v88xx_m rules), wrong LEIs (VR_ rules), EUIDs not found in BRIS and
                the LEI mask rule do not. The DPM business rules, prefixed v88xx_m and e2xxxx_e, are listed with
                severity “warning”: the file is accepted and the gaps come back as data-quality findings. The
                workbook does not state a severity for the other DPM technical checks (305, 330, 503); it moved the
                UTF-8 rule 306 out of that group specifically to make it blocking. Several of
                those were deactivated in March 2025, among them the rules that a legal person must carry an LEI or
                EUID (v8817_m, v8818_m) and that an end date must follow the start date (v8816_m); the regulation
                still asks for both, the engine no longer enforces them (<Cite s={SRC.rules} label="EBA workbook, 28 April 2025" />).
              </p>
              <p>
                The scale of the problem is public. In the ESAs’ 2024 dry run, {DRY_RUN_SOURCE.analysed} registers
                were analysed and {Math.round((1 - DRY_RUN_SOURCE.passedAll) * 1000) / 10}% failed at least one
                check; {Math.round(DRY_RUN_FAILURES[0].share * 100)}% of the failed checks were missing mandatory
                information and {Math.round(DRY_RUN_MISSING_BY_TEMPLATE[0].share * 100)}% of those sat in B_02.02
                (<Cite s={SRC.dryRun} label="ESA 2024 35, 17 December 2024" />). In its April 2025 observations
                from RoI reporting the EBA counted 58,170 reported EUIDs with an invalid format, against 2,717
                found in BRIS (<Cite s={SRC.observations} label="observations, April 2025" />).
              </p>
              <p>
                For 2026 the CSSF warned that the April 2025 checks “have not changed but will be applied to more
                data fields”, so “a register of information which was accepted last year, may be rejected this
                year” (<Cite s={SRC.cssf} label="CSSF, February 2026" />). The ESAs’ decision also lets the EBA
                require revisions through the competent authority after acceptance (ESA 2024 22, Article 7).
              </p>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Fixing a rejected register, step by step</h3>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[var(--text-dim)]">
                <li>Open the feedback file and sort by rule code. Deal with 1xx, 3xx and 7xx package errors and with 809 before anything else; until every table parses, the 807 list is noise.</li>
                <li>Clear every 805. For each, decide whether the value is missing or whether the ITS has nothing to put there; in the second case use the FAQ literal for that column, never a blank.</li>
                <li>Clear every 806 by finding the duplicate tuple. In B_02.02 compare all eight key columns, not the first two.</li>
                <li>Clear the 807s in resolution order: B_01.02, then B_05.01, then B_02.01, then B_03.02 and B_06.01, then everything that refers to them. Fix the defining table, not the referring one; one added row in B_05.01 often clears dozens of messages.</li>
                <li>Clear 503 by replacing labels with codes and adding the eba_ prefix; rule 330 by reformatting dates to yyyy-mm-dd.</li>
                <li>Rebuild the zip with all fifteen table files (empty ones with their header row), lower-case table file names, UTF-8, every template declared true in FilingIndicators.csv (rule 808), and the zip name in the FAQ’s pattern (Q24). Run the checks again before resubmitting.</li>
              </ol>
              <Link href="/dora-register" className="mt-6 inline-flex items-center text-sm font-semibold text-[var(--blue-light)] hover:underline">
                Run steps 1 to 6 on the file in your browser →
              </Link>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ---- Dates and versions ------------------------------------------- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">Dates and versions, as of {AS_OF}</h2>
          <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {[
              ['The obligation', <>Article 28(3) of DORA: maintain and update a register of all contractual arrangements on the use of ICT services at entity, sub-consolidated and consolidated level; make it available to the competent authority on request; report at least yearly on new arrangements. DORA applies from 17 January 2025 (<Cite s={SRC.dora} label="Regulation (EU) 2022/2554" />).</>],
              ['The templates', <>Commission Implementing Regulation (EU) 2024/2956 of 29 November 2024, published in the Official Journal on 2 December 2024 and in force on the twentieth day after (<Cite s={SRC.its} label="EUR-Lex" />). Annex I holds the fifteen templates and their instructions.</>],
              ['The data model', <>EBA reporting framework 4.0, taxonomy package 4.0 errata 5 of 20 March 2025, DORA module 1.1.0; the module code DORA010100 in the file name is this version (<Cite s={SRC.taxonomy} label="EBA" />, <Cite s={SRC.faq} label="FAQ Q24" />). DNB confirmed on 3 February 2026 that the taxonomy for the 2026 round was “exactly the same as last year” (<Cite s={SRC.dnb} label="DNB" />).</>],
              ['The rules', <>Validation rules workbook last updated 28 April 2025, with the March 2025 deactivations marked (<Cite s={SRC.rules} label="EBA" />). FAQ last updated 28 March 2025 (<Cite s={SRC.faq} label="ESAs" />).</>],
              ['Reference date and deadlines', <>ESA 2024 22, Article 4: the reference date is 31 December of the year before the submission; Article 5: competent authorities send the registers to the ESAs by 31 March each year (first cycle: reference 31 March 2025, deadline 30 April 2025) (<Cite s={SRC.decision} label="ESAs decision ESA 2024 22, 8 November 2024" />, <Cite s={SRC.faq} label="FAQ Q11 and Q13" />). Each authority sets an earlier window for entities: in 2026 DNB asked for submissions between 2 and 20 March, the CSSF between 11 February and 31 March (<Cite s={SRC.dnb} label="DNB" />, <Cite s={SRC.cssf} label="CSSF" />).</>],
              ['The next round', <>Under the standing decision the register with reference date 31 December 2026 is due to the ESAs by 31 March 2027; the national windows for it had not been announced on the pages above when we checked on {AS_OF}. Check your own authority’s page, and the EBA’s DORA page for any taxonomy change, before building the file.</>],
            ].map(([k, v], i) => (
              <div key={i} className="rule-fade pt-4">
                <dt className="font-display font-semibold text-white">{k}</dt>
                <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{v}</dd>
              </div>
            ))}
          </dl>
        </FadeIn>
      </Container>

      {/* ---- Sources -------------------------------------------------------- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">Sources</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              Every document below was fetched and read on {AS_OF}. The field reference and the diagram are generated
              from the taxonomy files, with acknowledgement of the EBA as source; nothing in them is retyped.
            </p>
            <ul className="mt-8 space-y-4">
              {Object.values(SRC).map((s) => (
                <li key={s.url} className="rule-fade pt-3 text-sm leading-6">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-[var(--blue-light)]">{s.name}</a>
                  <span className="block text-[var(--text-faint)]">{s.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <Faq items={FAQ} />
          </div>
        </FadeIn>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
