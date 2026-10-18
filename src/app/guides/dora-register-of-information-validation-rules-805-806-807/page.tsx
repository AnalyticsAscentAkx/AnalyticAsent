import Link from 'next/link'

import { Button } from '@/components/Button'
import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { pageMetadata, SITE_URL } from '@/lib/site'

// The question this page answers is the one a compliance officer types the
// morning after the NOK file arrives: "why was our register rejected, what do
// 805, 806 and 807 mean, how do we fix them". Google Suggest completes
// "dora register of information validation" only with "rules", and the
// results are EBA slide decks, a CSSF PDF and a vendor manual. None of them
// is an HTML page that walks the three codes end to end. This is that page.
//
// Every number, date and severity here is taken from a document we fetched
// and list under "Sources", with its date. Where two official documents
// disagree (they do, on 806) both are quoted and the difference is explained.

const PATH = '/guides/dora-register-of-information-validation-rules-805-806-807'
const CHECKED = '18 October 2026'

export const metadata = pageMetadata({
  title: 'DORA register errors 805, 806 and 807 explained',
  ogTitle: 'Why your DORA Register of Information was rejected: errors 805, 806 and 807',
  description:
    'What EBA validation errors 805, 806 and 807 mean, which of them reject a DORA Register of Information, and how to fix each one before you resubmit.',
  path: PATH,
  keywords: [
    'dora register of information validation rules',
    'eba dora roi',
    'eba dora register of information',
    'eba validation rules dpm 4.0',
    'dora register of information rejected',
    'error 807 foreign key constraint violated',
    'error 805 primary key missing',
    'error 806 identical key values',
    'detailed-feedback.csv',
    'register of information resubmission',
  ],
})

// --- sources ----------------------------------------------------------------
// Fetched and read on 18 October 2026. Each is linked inline where a fact
// rests on it; the list at the bottom is the bibliography.

const SRC = {
  feedback: {
    label: 'EBA, Explanation of data quality feedback from RoI validations',
    date: '10 February 2025',
    href: 'https://eba.europa.eu/sites/default/files/2025-02/9613c396-38b6-41fe-86a7-47c2c6461ef2/20250210%20-%20RoI%20validation%20feedback%20explanation.pdf',
  },
  rules: {
    label: 'EBA, Overview of the RoI reporting technical checks and validation rules (xlsx)',
    date: '28 April 2025',
    href: 'https://www.eba.europa.eu/sites/default/files/2025-04/10100a51-275f-4c98-96a1-f81342a8f57d/Overview%20of%20the%20RoI%20reporting%20technical%20checks%20and%20validation%20rules%20%28updated%2028%20April%202025%29%20%284%29.xlsx',
  },
  observations: {
    label: 'EBA, Observations from reporting of RoI to the ESAs: key common issues',
    date: '16 April 2025, updated 16 May 2025',
    href: 'https://eba.europa.eu/sites/default/files/2025-04/717e7e5f-14ac-45c6-b336-b0aac6a9062a/Observations%20from%20RoI%20reporting%20testing%20-%20common%20issues%20-%20April%202025%20%281%29.pdf',
  },
  cssf: {
    label: 'CSSF, Guidance for interpretation and resolution of ESA error messages related to the DORA register, v1.0',
    date: '15 May 2025',
    href: 'https://www.cssf.lu/wp-content/uploads/Guidance-for-interpretation-and-resolution-of-ESA-error-messages-related-to-the-DORA-register.pdf',
  },
  dryRun: {
    label: 'ESAs, DORA Dry Run exercise summary report (ESA 2024 35)',
    date: '17 December 2024',
    href: 'https://www.esma.europa.eu/sites/default/files/2024-12/ESA_2024_35_DORA_Dry_Run_exercise_summary_report.pdf',
  },
  taxonomy: {
    label: 'EBA, Preparations for reporting of DORA registers of information (Data Model for DORA RoI; taxonomy package 4.0, DORA module 1.1.0)',
    date: 'taxonomy package updated 21 March 2025',
    href: 'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application',
  },
  fi: {
    label: 'Finansinspektionen (Sweden), DORA felkoder informationsregister (error codes for the register, in Swedish)',
    date: '4 March 2026',
    href: 'https://www.fi.se/contentassets/b68845fcedb1419dbd2ca46fb762bde6/dora-felkoder-feedback.pdf',
  },
  caa: {
    label: 'Commissariat aux Assurances (Luxembourg), Note d’information 26/3 on the one-off additional RoI check, with annex of ESA checks',
    date: '15 April 2026',
    href: 'https://www.caa.lu/uploads/documents/files/Note_info_26-3.pdf',
  },
  cssf2026: {
    label: 'CSSF, communiqué on the 2026 DORA register of information collection',
    date: '17 March 2026',
    href: 'https://www.cssf.lu/en/2026/03/dora-register-of-information-collection/',
  },
  cbi2026: {
    label: 'Central Bank of Ireland, Reporting Registers of Information',
    date: 'updated 29 January 2026',
    href: 'https://centralbank.ie/regulation/digital-operational-resilience-act-dora/reporting-registers-of-information',
  },
  mfsa2026: {
    label: 'MFSA, circular on Register of Information additional data quality checks, year 2026',
    date: '5 March 2026',
    href: 'https://www.mfsa.mt/wp-content/uploads/2026/03/Regulation-EU-20222554-on-Digital-Operational-Resilience-for-the-Financial-Sector-%E2%80%93-Register-of-Information-Additional-Data-Quality-Checks-Year-2026.pdf',
  },
  its: {
    label: 'Commission Implementing Regulation (EU) 2024/2956 (the ITS on the register of information)',
    date: 'Official Journal, 2 December 2024',
    href: 'https://eur-lex.europa.eu/eli/reg_impl/2024/2956/oj',
  },
  dora: {
    label: 'Regulation (EU) 2022/2554 (DORA), Article 28(3)',
    date: 'Official Journal, 27 December 2022',
    href: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
  },
} as const

type Src = (typeof SRC)[keyof typeof SRC]

function Cite({ s, children }: { s: Src; children?: React.ReactNode }) {
  return (
    <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-[var(--blue-light)] hover:underline">
      {children ?? s.label}
    </a>
  )
}

// --- the three codes, in one table -------------------------------------------

const CODES: { code: string; name: string; category: string; rejects: string; fix: string }[] = [
  {
    code: '805',
    name: 'For open tables, the key columns values cannot be empty',
    category: 'Technical check (Additional Plain-csv)',
    rejects: 'Yes. The register is rejected.',
    fix: 'Fill every key column in every row, and delete fully empty or comma-only rows. For the three country keys in B_02.02 use eba_GA:qx2007 (“Not applicable”) where the value is not known; for a third-country provider with no LEI, use another identifier it has, as the ESAs FAQ allows.',
  },
  {
    code: '806',
    name: 'For open tables, you cannot have multiple rows with identical key values',
    category: 'Listed in the DPM Technical Checks tab (its category column says Additional Plain-csv)',
    rejects: 'The sources disagree. The EBA’s most-common-errors table and the CSSF say no; the 806 slide in the same EBA deck says a duplicated key “will be rejected with 806”. Fix it before you submit.',
    fix: 'De-duplicate on the whole key tuple of the table, not on one column. Two rows for the same provider LEI, or the same contract, entity, provider, function and service type, collapse into one.',
  },
  {
    code: '807',
    name: 'The reported data must follow the key-foreign key constraints defined in the DPM',
    category: 'Technical check (Additional Plain-csv)',
    rejects: 'Yes. The register is rejected.',
    fix: 'Every value in a foreign-key column must exist as a primary key in the table it points to. Add the missing row (most often the ultimate parent in B_05.01) or correct the reference.',
  },
]

// Primary keys per template, from the EBA taxonomy 4.0 DORA module 1.1.0. A
// row of a template is identified by the tuple of these columns, and 805 and
// 806 are evaluated against exactly this list.
const KEYS: [string, string, string][] = [
  ['B_01.01', 'c0010', 'LEI of the entity maintaining the register'],
  ['B_01.02', 'c0010', 'LEI of the entity'],
  ['B_01.03', 'c0010, c0020', 'Branch identification code, LEI of the head office'],
  ['B_02.01', 'c0010', 'Contractual arrangement reference number'],
  ['B_02.02', 'c0010, c0020, c0030, c0050, c0060, c0130, c0150, c0160', 'Contract, entity LEI, provider code, function identifier, type of ICT service, country of provision, location of data at rest, location of data management'],
  ['B_02.03', 'c0010, c0020', 'Intra-group contract reference, linked contract reference'],
  ['B_03.01', 'c0010, c0020', 'Contract reference, LEI of the signing entity'],
  ['B_03.02', 'c0010, c0020', 'Contract reference, provider code'],
  ['B_03.03', 'c0010, c0020', 'Contract reference, LEI of the entity providing ICT services (intra-group)'],
  ['B_04.01', 'c0010, c0020, c0040', 'Contract reference, LEI of the entity, branch identification code'],
  ['B_05.01', 'c0010', 'Identification code of the ICT third-party service provider'],
  ['B_05.02', 'c0010, c0020, c0030, c0050, c0060', 'Contract reference, type of ICT service, provider code, rank, code of the recipient of the sub-contracted service'],
  ['B_06.01', 'c0010, c0040', 'Function identifier, LEI of the financial entity'],
  ['B_07.01', 'c0010, c0020, c0040', 'Contract reference, provider code, type of ICT service'],
]

// The twenty-two foreign-key references the taxonomy declares (R1 to R22),
// grouped by what the pointing column must match. Rule 807 is the whole of
// this list and nothing else.
const REFS: { target: string; what: string; from: string[] }[] = [
  {
    target: 'B_02.01 c0010 (a contract reference)',
    what: 'Every contract reference used anywhere must be a row in B_02.01.',
    from: ['B_02.01 c0030 (overarching arrangement, self-reference, R13)', 'B_02.03 c0010 and c0020 (R11, R12)', 'B_03.01 c0010 (R10)', 'B_03.02 c0010 (R9)', 'B_03.03 c0010 (R8)', 'B_04.01 c0010 (R16)', 'B_05.02 c0010 (R14)', 'B_07.01 c0010 (R15)'],
  },
  {
    target: 'B_01.02 c0010 (an entity LEI)',
    what: 'Every LEI used as a financial entity must be listed in B_01.02.',
    from: ['B_01.02 c0060 (direct parent, self-reference, R6)', 'B_01.03 c0020 (R3)', 'B_03.01 c0020 (R2)', 'B_03.03 c0020 (R1)', 'B_04.01 c0020 (R4)', 'B_06.01 c0040 (R5)'],
  },
  {
    target: 'B_05.01 c0010 (a provider code)',
    what: 'Every provider code, including every ultimate parent, must have its own row in B_05.01.',
    from: ['B_05.01 c0110 (ultimate parent, self-reference, R18)', 'B_03.02 c0020 (R19)', 'B_05.02 c0030 (provider) and c0060 (recipient of the sub-contracted service) (R20, R21)', 'B_07.01 c0020 (R22)'],
  },
  {
    target: 'B_06.01 (c0010, c0040) (a function for an entity)',
    what: 'A function identifier in B_02.02 must be defined in B_06.01 for the same entity LEI.',
    from: ['B_02.02 (c0050, c0020) (R7)'],
  },
  {
    target: 'B_03.02 (c0010, c0020) (a contract signed by a provider)',
    what: 'Each contract and provider pair used in B_02.02 needs a signing row in B_03.02.',
    from: ['B_02.02 (c0010, c0030) (R17)'],
  },
]

// The six source/destination pairs the CSSF names as the most frequent 807s,
// in the order it prints them.
const FREQUENT_807: [string, string][] = [
  ['b_03.01 c0020', 'b_01.02 c0010'],
  ['b_02.02 c0020', 'b_06.01 c0040'],
  ['b_02.03 c0010', 'b_02.01 c0010'],
  ['b_05.02 c0030', 'b_05.01 c0010'],
  ['b_04.01 c0020', 'b_01.02 c0010'],
  ['b_05.01 c0110', 'b_05.01 c0010'],
]

// The EBA's own ranking of the most common errors, with its "leads to reject"
// column reproduced exactly. 806 is the surprise in it.
const COMMON: [string, string, string][] = [
  ['807', 'Foreign key constraint violated', 'Yes'],
  ['v8886_m, v8850_m, v8885_m, v8884_m, v8888_m, v88889_m', 'Mandatory values missing', 'No'],
  ['805', 'Primary key missing', 'Yes'],
  ['808', 'Missing filing indicators or case is wrong', 'Yes'],
  ['VR_71, VR_23, VR_12, VR_77', 'Wrong LEI reported', 'No'],
  ['720', 'Non-DORA files reported, or case is wrong', 'Yes'],
  ['806', 'For open tables you cannot report identical key values', 'No'],
  ['714', 'entityID parameter - does not match filename', 'Yes'],
  ['VR_72', 'EUID code was not found in BRIS', 'No'],
  ['103', 'Report file structure - content', 'Yes'],
  ['801', 'All table header codes must be in the taxonomy', 'Yes'],
  ['v8826_m', 'LEI mask validity', 'No'],
]

// Worked example. The bank and its provider are fictional; the LEIs are
// synthetic but carry valid ISO 17442 check digits, so a format check passes
// and only GLEIF says they do not exist. It is modelled on, but is not the same
// as, the sample register the checker ships.
const EX = {
  bank: '7245009VELDHAVENBK96',
  cloud: '7245009KESSELVOSCL89',
  holding: '7245009KESSELVOSHL44',
}

const FAQ = [
  {
    q: 'What does error 807 mean on a DORA register of information?',
    a: 'Rule 807, "The reported data must follow the key-foreign key constraints defined in the DPM", fires when a value in a foreign-key column has no matching primary key in the table it points to. The most frequent case is an ultimate parent code in B_05.01 column c0110 that has no row of its own in B_05.01; others are a contract reference used in B_02.02, B_02.03, B_03.xx, B_04.01, B_05.02 or B_07.01 that is missing from B_02.01, and a function identifier in B_02.02 not defined in B_06.01 for the same entity. 807 is a technical check, so the register is rejected (EBA rule list, 28 April 2025; CSSF guidance, 15 May 2025).',
  },
  {
    q: 'Does error 806 reject the register?',
    a: 'The official documents do not agree. The EBA rule workbook of 28 April 2025 lists 806 in the DPM Technical Checks tab, not the Technical checks tab that rejects; the most-common-errors table in the EBA observations deck (April 2025, updated 16 May 2025) marks it "Leads to reject: NO"; and the CSSF guidance of 15 May 2025 calls it a warning that you are nevertheless requested to fix and resubmit. But the 806 slide in that same EBA deck says that a key reported twice "will be rejected with 806", and the EBA adds that national portals may run their own checks. Treat 806 as something to clear before you submit.',
  },
  {
    q: 'Why did one mistake produce hundreds of 807 errors?',
    a: 'Because the table being pointed at was never loaded. If a table fails 801 (a header code not in the taxonomy), 805 (an empty key), 809 (rows with the wrong number of cells) or 306 (not UTF-8), the EBA engine cannot integrate it, and every foreign key in every other table that refers to it then fails with 807. The EBA calls this expected behaviour, and in May 2025 added rule 809 precisely so that the first failure is reported in its own words. Fix the loading error first and most of the 807s disappear.',
  },
  {
    q: 'What is the difference between error 805 and a v88xx_m "value should not be missing" warning?',
    a: '805 is about key columns: the columns that identify a row, listed in the Data Model as primary keys. An empty key means the row cannot be stored, so 805 rejects the file. The v88xx_m rules are DPM business validation rules on other mandatory columns (for example v8850_m, the type of identification code in B_05.01 c0020). They are listed with severity "warning", come back in the results file, and do not reject the register. Missing mandatory information was also the most common finding in the ESAs\' 2024 dry run, which used its own set of checks: 86% of the failures there were of that type.',
  },
  {
    q: 'We have a provider with no LEI. How do we avoid 805 and 807 on it?',
    a: 'The ESAs FAQ (Q40, as quoted in the CSSF guidance) says that where an LEI is not available for a third-country provider or its ultimate parent, the entity should populate the key field with any relevant value so that the file is not rejected on referential integrity; in practice another identifier the provider has. That value will be flagged as a data-quality warning but the register is accepted. Whatever code you choose must appear in B_05.01 c0010 as its own row, with c0020 declaring the code type, before it is used in c0110, B_02.02, B_03.02, B_05.02 or B_07.01. In 2026 the ESAs added data-quality checks that flag placeholders: a provider or ultimate-parent code containing DUMMY, INVALID or NOTAPPLICABLE, or equal to 0, NONE, TRUE, FALSE, LEI or EUID, is reported back (codes E003 and E005 in the annex to the CAA note of 15 April 2026), so use a real identifier rather than a filler.',
  },
  {
    q: 'What is in the feedback file the ESAs send back?',
    a: 'A zip named like your submission with a status suffix: _NOK_ for a rejection, _PEN_ for an acknowledgement pending further validation, and _RES_ for the results of the DPM and LEI/EUID checks. Inside are instance-status.csv (receivedFile, receivedTime, feedbackMain and a feedbackText such as "Multiple business validation rules triggered: VR_85, VR_99, VR_23") and detailed-feedback.csv with the header templateCode,rowCode/rowNumber,columnCode,ruleCode,message,offendingValue. Template codes are lower case with an underscore (b_05_01). A PEN response carries no detailed-feedback.csv.',
  },
]

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 font-mono text-[0.9em] text-white">{children}</code>
}

function Pre({ title, children }: { title: string; children: string }) {
  return (
    <figure className="mt-5 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-card)]">
      <figcaption className="border-b border-[var(--line)] px-4 py-2 font-mono text-xs text-[var(--text-faint)]">{title}</figcaption>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-6 text-[var(--text)]">{children}</pre>
    </figure>
  )
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28 font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
      {children}
    </h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-10 font-display text-lg font-semibold text-white">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-3xl leading-7 text-[var(--text-dim)]">{children}</p>
}

function ArticleStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Why your DORA Register of Information was rejected: errors 805, 806 and 807',
    description: metadata.description,
    url: `${SITE_URL}${PATH}`,
    datePublished: '2026-10-18',
    dateModified: '2026-10-18',
    inLanguage: 'en',
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    about: ['DORA register of information', 'EBA validation rules', 'ITS 2024/2956'],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

export default function Guide() {
  return (
    <RootLayout>
      <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'DORA register errors 805, 806 and 807', path: PATH }]} />
      <ArticleStructuredData />

      <PageIntro eyebrow="Guide · DORA Register of Information" title="Why your register was rejected, and how to fix errors 805, 806 and 807">
        <p>
          A DORA Register of Information is rejected when it fails one of the EBA’s technical checks. Two of the
          three codes in the question do that: <strong className="text-white">805</strong> means a key column is
          empty in some row, and <strong className="text-white">807</strong> means a value points at a row that
          does not exist in the table it must match, most often an ultimate parent with no row of its own in
          B_05.01. <strong className="text-white">806</strong> means two rows share the same key; the EBA’s
          own documents disagree on whether it rejects, so fix it before you submit. The fix for all three is
          the same discipline: every key filled, every key unique, every reference resolvable. The rest of this
          page shows what each code looks like in the feedback file, what causes it and how to clear it.
        </p>
      </PageIntro>

      <Container className="mt-12 sm:mt-16">
        <FadeIn>
          <p className="text-sm text-[var(--text-faint)]">
            Sources checked {CHECKED}. Rule texts are the EBA’s, from its rule list of 28 April 2025 (the EBA spells 807
            “contraints”; we have corrected it). Severities are as the EBA and the CSSF published them in April and May
            2025. Nothing here is legal advice.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
                  <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Code</th>
                  <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Rule, as the EBA words it</th>
                  <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Category</th>
                  <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Rejects the file?</th>
                  <th className="border-b border-[var(--line)] py-2 font-medium">Fix</th>
                </tr>
              </thead>
              <tbody>
                {CODES.map((c) => (
                  <tr key={c.code} className="align-top">
                    <td className="border-b border-[var(--line)] py-3 pr-4 font-mono text-base text-white">{c.code}</td>
                    <td className="border-b border-[var(--line)] py-3 pr-4 text-[var(--text)]">{c.name}</td>
                    <td className="border-b border-[var(--line)] py-3 pr-4 text-[var(--text-dim)]">{c.category}</td>
                    <td className="border-b border-[var(--line)] py-3 pr-4 text-[var(--text-dim)]">{c.rejects}</td>
                    <td className="border-b border-[var(--line)] py-3 text-[var(--text-dim)]">{c.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            Categories and rule texts: <Cite s={SRC.rules}>EBA rule list, 28 April 2025</Cite>. Rejection or warning:{' '}
            <Cite s={SRC.observations}>EBA observations, April 2025</Cite> and <Cite s={SRC.cssf}>CSSF guidance, 15 May 2025</Cite>.
          </p>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <H2 id="how-validation-works">How the ESAs validate a register, and what “rejected” means</H2>
          <P>
            The EBA’s <Cite s={SRC.feedback}>explanation of the validation feedback (10 February 2025)</Cite> describes four
            categories of checks: technical validations, DPM technical checks, DPM business validation rules, and EUID
            and LEI checks. They run in sequence. First comes data reception, where the technical checks run on the
            package: file name, zip structure, UTF-8 encoding, the three metadata files, table headers, keys and foreign
            keys. A failure there ends in a reject (NOK) and nothing further is run. A file that passes is acknowledged,
            and then the DPM technical checks, the DPM business validation rules and the LEI and EUID checks run on it,
            and their findings are returned as validation results.
          </P>
          <P>
            The response is built twice at most. A rejected file gets one zip whose name ends in{' '}
            <Code>_NOK_</Code>. An accepted file first gets an acknowledgement ending in <Code>_PEN_</Code> (pending
            further validations), then the results ending in <Code>_RES_</Code>. Each zip holds a folder of the same name
            with <Code>instance-status.csv</Code> and, except for the PEN acknowledgement, <Code>detailed-feedback.csv</Code>.
            The detailed file has the header{' '}
            <Code>templateCode,rowCode/rowNumber,columnCode,ruleCode,message,offendingValue</Code>, with template codes in
            lower case and an underscore, such as <Code>b_05_01</Code>.
          </P>
          <P>
            Which tab of the EBA’s <Cite s={SRC.rules}>rule workbook (28 April 2025)</Cite> a rule sits in therefore decides
            its consequence. The CSSF states it plainly in its{' '}
            <Cite s={SRC.cssf}>guidance of 15 May 2025</Cite>: messages in the “Technical checks” tab are errors and
            result in rejection; messages in the “DPM Business Validation Rules” and “LEI-EUID checks” tabs are warnings
            that do not reject the register, although entities are expected to fix them and resubmit. In that workbook
            805 and 807 are in the Technical checks tab, under the heading “Additional Plain-csv”, together with 801,
            802, 808 and 809. 806 is in the DPM Technical Checks tab, with 305, 330, 331 and 503.
          </P>
          <P>
            The EBA adds a caveat worth keeping in mind: its{' '}
            <Cite s={SRC.observations}>observations deck</Cite> says the checks and messages implemented by national
            competent authorities in their own collection portals may differ from the EBA’s. A portal can refuse a file
            on a check the EBA treats as a warning. The order below is the EBA’s; your authority’s portal may be stricter,
            never looser.
          </P>
        </FadeIn>
      </Container>

      <div className="section-lift mt-20 py-16 sm:mt-24 sm:py-20">
        <Container>
          <FadeIn>
            <p className="text-sm font-semibold text-[var(--blue-light)]">The official numbers</p>
            <h2 className="mt-3 max-w-3xl font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Failing a check is the normal first outcome, not the exception
            </h2>
          </FadeIn>
          <dl className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['93.5%', 'of the 947 registers analysed in the ESAs’ 2024 dry run failed at least one data-quality check; 6.5% passed all 116'],
              ['92', 'of 1,039 dry-run submissions were discarded before analysis for failing the integration checks'],
              ['86%', 'of the dry-run data-quality failures were missing mandatory information'],
              ['58,170', 'EUID checks returned INVALID_EUID_FORMAT in the reporting the EBA had seen by April 2025, against 2,717 FOUND and 258 NOT_FOUND'],
            ].map(([v, l]) => (
              <FadeIn key={l}>
                <div className="rule-fade flex flex-col-reverse pt-5">
                  <dt className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{l}</dt>
                  <dd className="stat font-display text-4xl font-medium">{v}</dd>
                </div>
              </FadeIn>
            ))}
          </dl>
          <FadeIn>
            <p className="mt-8 max-w-3xl text-sm text-[var(--text-faint)]">
              <Cite s={SRC.dryRun}>ESA 2024 35, 17 December 2024</Cite>, paragraphs 24, 25 and 30;{' '}
              <Cite s={SRC.observations}>EBA observations, April 2025</Cite>, slide 20. We have found no published
              aggregate statistics from the 2025 or 2026 registers.
            </p>
          </FadeIn>
          <FadeIn>
            <H3>The EBA’s own list of the most common errors</H3>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-dim)]">
              In the order the EBA printed them in April 2025, with its “leads to reject” column. Three of the top seven
              are key rules.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
                    <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Rule codes</th>
                    <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Description</th>
                    <th className="border-b border-[var(--line)] py-2 font-medium">Leads to reject</th>
                  </tr>
                </thead>
                <tbody>
                  {COMMON.map(([code, desc, rej]) => (
                    <tr key={code}>
                      <td className="border-b border-[var(--line)] py-2 pr-4 font-mono text-xs text-white">{code}</td>
                      <td className="border-b border-[var(--line)] py-2 pr-4 text-[var(--text-dim)]">{desc}</td>
                      <td className="border-b border-[var(--line)] py-2 text-[var(--text)]">{rej}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        </Container>
      </div>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <H2 id="error-805">Error 805: a key column is empty</H2>
          <P>
            <strong className="text-white">What it says.</strong> “For open tables, the key columns values cannot be
            empty.” In the feedback file it appears as{' '}
            <Code>[table],[row],[column],805,For open tables, the key columns values cannot be empty,None</Code>, one
            line per empty key cell (<Cite s={SRC.cssf}>CSSF, 15 May 2025</Cite>).
          </P>
          <P>
            <strong className="text-white">What it means.</strong> Every template in the register is an “open table”:
            a list of rows that you define rather than a fixed grid. Each has a primary key, one column or a combination
            of columns, that identifies a row. A row with an empty key cannot be stored, so the EBA engine cannot load
            the table, and because it is a technical check the whole package is rejected. The EBA’s observations deck
            adds the consequence that catches people out: when a table fails to load on 805 (or 801), every other table
            that refers to it fails its foreign keys too, so one empty key column can arrive as a page of 807s.
          </P>
          <P>
            <strong className="text-white">Which columns are keys.</strong> The key columns are set in the EBA’s Data
            Model for the DORA RoI (shown in bold there) and in the taxonomy. This is the full list, from the{' '}
            <Cite s={SRC.taxonomy}>EBA taxonomy 4.0, DORA module 1.1.0</Cite> (errata 5):
          </P>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
                  <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Template</th>
                  <th className="border-b border-[var(--line)] py-2 pr-4 font-medium">Key columns</th>
                  <th className="border-b border-[var(--line)] py-2 font-medium">What they are</th>
                </tr>
              </thead>
              <tbody>
                {KEYS.map(([t, cols, what]) => (
                  <tr key={t} className="align-top">
                    <td className="border-b border-[var(--line)] py-2 pr-4 font-mono text-xs text-white">{t}</td>
                    <td className="border-b border-[var(--line)] py-2 pr-4 font-mono text-xs text-[var(--text)]">{cols}</td>
                    <td className="border-b border-[var(--line)] py-2 text-[var(--text-dim)]">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            B_99.01 has no key. B_02.02 has eight key columns; it is also the template where the dry run found the
            largest share of missing information, 60% of it (<Cite s={SRC.dryRun}>ESA 2024 35</Cite>, paragraph 32).
          </p>
          <H3>The causes we see most</H3>
          <ol className="mt-4 max-w-3xl list-decimal space-y-3 pl-5 leading-7 text-[var(--text-dim)]">
            <li>
              <strong className="text-white">The country keys in B_02.02 left blank.</strong> Columns c0130 (country of
              provision), c0150 (location of data at rest) and c0160 (location of data management) are key fields,
              so they cannot be empty. The CSSF’s instruction: where the value is not known, use the code{' '}
              <Code>eba_GA:qx2007</Code>, which stands for “Not applicable”; and never the country name: Ireland is{' '}
              <Code>eba_GA:IE</Code>, not “Ireland”.
            </li>
            <li>
              <strong className="text-white">A provider or parent with no identifier.</strong> B_05.01 c0010 is a key.
              Where a third-country provider or its ultimate parent has no LEI, the ESAs FAQ (Q40, quoted in the CSSF
              guidance) says to populate the field with any relevant identifier the provider has so the file is not
              rejected on referential integrity; the use of such an identifier is flagged as a data-quality warning, not
              a rejection. Declare the code type in c0020.
            </li>
            <li>
              <strong className="text-white">A function row without a function identifier, or a B_07.01 row without a
              service type.</strong> These usually come from a spreadsheet export where a merged cell or a filtered
              row left the key column empty on one line. The row looks complete to a person because the identifier is
              on the line above.
            </li>
            <li>
              <strong className="text-white">Empty rows at the end of a table.</strong> Sweden’s Finansinspektionen
              lists rows that are blank, or contain nothing but commas, as a cause of 805: the usual result of exporting
              a spreadsheet with formatted but empty lines. Delete those rows{' '}
              (<Cite s={SRC.fi}>FI, 4 March 2026</Cite>).
            </li>
          </ol>
          <H3>How to fix 805</H3>
          <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-5 leading-7 text-[var(--text-dim)]">
            <li>Read the <Code>templateCode</Code>, <Code>rowCode/rowNumber</Code> and <Code>columnCode</Code> on each 805 line. The CSSF’s examples quote line numbers of the CSV file, so open the file as text to find the row, not the spreadsheet it came from.</li>
            <li>For each table in the list above, filter on an empty value in each key column. Do this in the CSV, not in the spreadsheet you exported it from.</li>
            <li>Fill the cell with the correct value or the sanctioned placeholder (<Code>eba_GA:qx2007</Code> for the three country keys; an alternative identifier for a provider with no LEI). Never delete the row to make the error go away unless the row is genuinely a duplicate or empty.</li>
            <li>Re-run the keys check before looking at any 807: many of them will have been caused by the table not loading.</li>
          </ol>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <H2 id="error-806">Error 806: two rows share the same key</H2>
          <P>
            <strong className="text-white">What it says.</strong> “For open tables, you cannot have multiple rows with
            identical key values.” The feedback carries one line per offending row, with the key value in{' '}
            <Code>offendingValue</Code>; the CSSF’s example is a b_05.01 where lines 2 and 37 carry the same LEI, and
            since c0010 is the only key of that table, the value cannot appear twice.
          </P>
          <P>
            <strong className="text-white">What it means.</strong> The key of a table is the whole tuple of its key
            columns. For B_05.01 that is one column, so one provider gets one row, whatever name variants or
            contracts it has. For B_02.02 the key is eight columns: the same contract, entity, provider, function and
            service type at the same country of provision, data-at-rest location and data-management location. Two
            rows that match on all eight are a duplicate; two rows that differ on any one of them are not, and are
            frequently legitimate (the same service provided from two countries, for instance).
          </P>
          <P>
            <strong className="text-white">Does it reject?</strong> The official documents disagree. The EBA’s rule
            workbook of 28 April 2025 places 806 in the DPM Technical Checks tab, not in the Technical checks tab whose
            failures reject. The most-common-errors table in the EBA’s{' '}
            <Cite s={SRC.observations}>observations deck</Cite> marks it “Leads to reject: NO”, and the{' '}
            <Cite s={SRC.cssf}>CSSF guidance</Cite> calls it a warning message, adding that financial entities are
            nevertheless requested to fix the issue and resubmit. Yet the 806 slide in that same EBA deck says that if a
            user reports the same key twice “it will be rejected with 806”. Add the EBA’s own caveat that national
            portals may run different checks, and the only safe reading is: clear every 806 before you submit.
          </P>
          <H3>The causes we see most</H3>
          <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 leading-7 text-[var(--text-dim)]">
            <li>
              <strong className="text-white">One provider, several spellings.</strong> The provider list was built by
              appending contract extracts, so the same LEI appears with “Ltd”, “Limited” and “LTD”. The LEI is the key;
              the name is not. Keep one row.
            </li>
            <li>
              <strong className="text-white">The signing table built from the service table.</strong> B_03.02 has the
              key (contract, provider). A contract with five service rows in B_02.02 produces five identical signing
              rows if the export is not de-duplicated. The same happens to B_07.01, keyed on (contract, provider,
              service type).
            </li>
            <li>
              <strong className="text-white">A group register merged from entity registers.</strong> Each subsidiary
              listed the shared cloud provider and the shared parent; the consolidated B_05.01 then has them three
              times.
            </li>
          </ul>
          <H3>How to fix 806</H3>
          <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-5 leading-7 text-[var(--text-dim)]">
            <li>Take the key tuple for the table from the list above and group the rows on exactly those columns.</li>
            <li>Where a group has more than one row and the non-key columns agree, keep one.</li>
            <li>Where the non-key columns disagree (two expense figures for one provider, two headquarters countries), the duplicate is hiding a data question. Resolve it against the contract or the provider’s GLEIF record; do not keep the first row by default.</li>
            <li>If the rows differ because they should differ, one of the key columns is wrong, not the rule. A service delivered from two countries is two B_02.02 rows with different c0130, not one row twice.</li>
          </ol>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <H2 id="error-807">Error 807: a reference points at a row that does not exist</H2>
          <P>
            <strong className="text-white">What it says.</strong> “The reported data must follow the key-foreign key
            constraints defined in the DPM.” The feedback line names the source: the table, row and column that holds
            the value, and the value itself in <Code>offendingValue</Code>. It does not name the destination table; you
            find that from the Data Model, or from the list below.
          </P>
          <P>
            <strong className="text-white">What it means.</strong> The fifteen templates are one relational database.
            The taxonomy declares twenty-two foreign-key references: each value in a referencing column (or pair of
            columns) must exist as a primary key in another table, or in the same table. The match is exact: a value
            with an extra space does not match (<Cite s={SRC.fi}>FI, 4 March 2026</Cite>), and the CSSF notes that a
            table not encoded in UTF-8 can trigger a high number of 807s. The CSSF separates the two kinds. “Across tables”: a contract reference in
            B_07.01 that is not in B_02.01. “Self-reference”: an overarching contract reference in B_02.01 c0030 that
            has no row in B_02.01 c0010, or an ultimate parent code in B_05.01 c0110 that has no row in B_05.01 c0010.
            Both are rejections.
          </P>
          <H3>All twenty-two references, grouped by what must exist</H3>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {REFS.map((r) => (
              <div key={r.target} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
                <p className="font-mono text-sm text-white">{r.target}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{r.what}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-[var(--text-faint)]">Pointed at from</p>
                <ul className="mt-1 space-y-1 font-mono text-xs text-[var(--text)]">
                  {r.from.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            Reference numbers R1 to R22 are the taxonomy’s own (<Cite s={SRC.taxonomy}>EBA taxonomy 4.0, DORA module 1.1.0</Cite>).
          </p>
          <H3>The six pairs that fail most often</H3>
          <P>
            The CSSF lists the source and destination columns that most frequently trigger 807 in the registers it
            forwarded. Read each row as: every value in the source column must exist in the destination column.
          </P>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full max-w-xl border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
                  <th className="border-b border-[var(--line)] py-2 pr-6 font-medium">Source</th>
                  <th className="border-b border-[var(--line)] py-2 font-medium">Must exist in</th>
                </tr>
              </thead>
              <tbody>
                {FREQUENT_807.map(([from, to]) => (
                  <tr key={from}>
                    <td className="border-b border-[var(--line)] py-2 pr-6 font-mono text-xs text-white">{from}</td>
                    <td className="border-b border-[var(--line)] py-2 font-mono text-xs text-[var(--text)]">{to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            <Cite s={SRC.cssf}>CSSF guidance, 15 May 2025</Cite>, rule code 807, examples table.
          </p>
          <H3>Why the ultimate parent is the usual culprit</H3>
          <P>
            B_05.01 asks for each provider’s ultimate parent undertaking in c0110, and the taxonomy declares that column
            a foreign key to c0010 of the same table (R18). So the parent is not just a name you write down against the
            subsidiary: it must have its own full row in B_05.01, with its own identification code, code type, legal
            name, type of person and country. A provider list built from “who do we pay” never includes the parent,
            because nobody pays it, so it never gets a row. The fix is one row per parent, and if the parent has no LEI,
            an alternative identifier declared in c0020 and used consistently. Two newer checks bear on c0110. Business
            rule v8855_m returns a warning when c0110 is empty on a row that has other values. The ESAs’ 2026 checks
            (E005, <Cite s={SRC.caa}>CAA annex, 15 April 2026</Cite>) reject placeholder parent codes and say that
            where the parent is not known or does not apply, the field should be left blank. A blank warning is better
            than a placeholder that fails. Since 2026 the parent code is also compared with the ultimate parent GLEIF
            holds for a provider with an LEI (E018).
          </P>
          <H3>How to fix 807</H3>
          <ol className="mt-4 max-w-3xl list-decimal space-y-2 pl-5 leading-7 text-[var(--text-dim)]">
            <li>First clear every 306, 801, 805 and 809 in the feedback. Each of those stops a table loading, and a table that did not load fails every reference to it. The EBA introduced 809 in May 2025 for exactly this reason.</li>
            <li>Sort the remaining 807 lines by <Code>templateCode</Code> and <Code>columnCode</Code>. Match each pair to its destination in the list above.</li>
            <li>For each offending value, decide which side is wrong. A contract reference with a typo is fixed at the source. A parent with no row is fixed at the destination by adding the row. A function identifier that B_06.01 defines for a different entity LEI is fixed by adding the function for that entity or by correcting c0020 in B_02.02.</li>
            <li>Check the trailing and leading spaces, case and quotes on both sides. The comparison is exact; <Code>C-2023-014</Code> and <Code>C-2023-014 </Code> are different keys.</li>
            <li>If a B_02.01 row has type “subsequent or associated arrangement” (<Code>eba_CO:x3</Code>), c0030 must hold the overarching contract’s reference, and that contract must be a row of its own. If the type is standalone, leave c0030 empty rather than typing a filler, because any filler is a reference and will be checked.</li>
          </ol>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <H2 id="worked-example">A worked example, from feedback file to fix</H2>
          <P>
            A fictional bank, Veldhaven Bank N.V., submits for its group. The LEIs below are synthetic: they carry
            valid ISO 17442 check digits, and GLEIF returns “not found” for them. The provider and its parent are
            invented. Four things in the package are wrong.
          </P>
          <Pre title="reports/b_05.01.csv (extract)">{`c0010,c0020,c0030,c0040,c0050,c0060,c0070,c0080,c0090,c0100,c0110,c0120
${EX.cloud},eba_qCO:qx2000,,,Kesselvos Cloud B.V.,Kesselvos Cloud B.V.,eba_CT:x212,eba_GA:NL,eba_CU:EUR,1840000,${EX.holding},eba_qCO:qx2000
${EX.cloud},eba_qCO:qx2000,,,Kesselvos Cloud BV,Kesselvos Cloud BV,eba_CT:x212,eba_GA:NL,eba_CU:EUR,1840000,${EX.holding},eba_qCO:qx2000`}</Pre>
          <Pre title="reports/b_02.02.csv (extract, key columns only)">{`c0010,c0020,c0030,c0050,c0060,c0130,c0150,c0160
C-2023-014,${EX.bank},${EX.cloud},F7,eba_TA:S18,eba_GA:NL,eba_GA:IE,
C-2023-015,${EX.bank},${EX.cloud},F9,eba_TA:S02,eba_GA:NL,eba_GA:NL,eba_GA:NL`}</Pre>
          <P>
            The EBA’s engine returns a NOK zip. Its detailed-feedback.csv, constructed here from the EBA’s header and
            the message texts the CSSF documents (the EBA does not publish how it numbers rows or orders lines), would
            read:
          </P>
          <Pre title="…_NOK_….zip / detailed-feedback.csv">{`templateCode,rowCode/rowNumber,columnCode,ruleCode,message,offendingValue
b_02_02,1,c0160,805,"For open tables, the key columns values cannot be empty",None
b_05_01,1,c0110,807,The reported data must follow the key-foreign key constraints defined in the DPM,${EX.holding}
b_05_01,2,c0110,807,The reported data must follow the key-foreign key constraints defined in the DPM,${EX.holding}
b_02_02,2,c0050,807,The reported data must follow the key-foreign key constraints defined in the DPM,F9`}</Pre>
          <P>Reading it line by line:</P>
          <ol className="mt-4 max-w-3xl list-decimal space-y-3 pl-5 leading-7 text-[var(--text-dim)]">
            <li>
              <strong className="text-white">805 on b_02_02 row 1, c0160.</strong> The location of data management
              was left empty on the first service row. It is a key. The data is managed in Ireland, so the value is{' '}
              <Code>eba_GA:IE</Code>; had it genuinely not applied, <Code>eba_GA:qx2007</Code>.
            </li>
            <li>
              <strong className="text-white">807 on b_05_01 c0110, twice.</strong> Kesselvos Holding is named as the
              ultimate parent in c0110 but has no row of its own. Add it:
                  <Pre title="reports/b_05.01.csv (row added)">{`${EX.holding},eba_qCO:qx2000,,,Kesselvos Holding B.V.,Kesselvos Holding B.V.,eba_CT:x212,eba_GA:NL,,,,`}</Pre>
              The holding has no parent above it, so its own c0110 and c0120 are left blank, which the 2026 checks
              prefer to a placeholder; v8855_m may return that blank as a warning, which does not reject. c0090 and c0100 are
              empty because nothing is paid to the holding directly; the CSSF’s note on rule 305 says the annual
              expense in c0100 is expected where the provider is a direct provider, which the holding is not. The
              rest of the row must be complete, or v8850_m and the other mandatory-value rules will come back as warnings.
            </li>
            <li>
              <strong className="text-white">807 on b_02_02 row 2, c0050.</strong> Function F9 is used but B_06.01
              defines no F9 for the bank’s LEI. Either the identifier is a typo for F7, or the function was never added
              to B_06.01. Check the function list; the fix is on whichever side is wrong.
            </li>
          </ol>
          <P>
            The fourth fault is not in the NOK file. B_05.01 lists Kesselvos Cloud twice, under the same LEI with two
            spellings of the name. That is an 806, and 806 is listed among the DPM technical checks, which on the EBA’s
            documented sequence run only after a file has passed reception. So on that sequence it surfaces in the RES
            file after the other faults are fixed, not now. A national portal may catch it earlier, and the EBA’s own
            deck is inconsistent on whether it rejects (see above). Remove the second row now: the LEI is the key, and
            names that differ only in punctuation make this a de-duplication, not a data question.
          </P>
          <P>
            Two of the four lines in the NOK file come from one missing row. After the fixes the package passes the
            technical checks, is acknowledged with PEN, and the RES file then reports whatever warnings remain.
          </P>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <H2 id="procedure">The resubmission procedure, in order</H2>
          <ol className="mt-6 max-w-3xl list-decimal space-y-3 pl-5 leading-7 text-[var(--text-dim)]">
            <li>
              <strong className="text-white">Read instance-status.csv first.</strong> <Code>feedbackMain</Code> tells
              you whether this is a rejection (REJECTED), an acknowledgement (PENDING_FURTHER_VALIDATIONS) or results
              (VALIDATION_RESULTS). Only a rejection means the register was not accepted.
            </li>
            <li>
              <strong className="text-white">Group detailed-feedback.csv by ruleCode.</strong> A register with one
              systematic mistake produces thousands of identical lines. Count them per rule and template before reading
              any of them.
            </li>
            <li>
              <strong className="text-white">Fix in loading order.</strong> Package and encoding (103, 306, 714, 720,
              723, 724), then headers and rows (801, 802, 809), then filing indicators (808), then empty keys (805),
              then references (807), then duplicates (806). Each layer can mask the next; the EBA says a table that fails
              801 or 805 makes the 807s that follow “expected behaviour”.
            </li>
            <li>
              <strong className="text-white">Re-run the checks locally before you upload.</strong> The rules are
              public and deterministic. The{' '}
              <Link href="/dora-register" className="text-[var(--blue-light)] hover:underline">DORA Register Checker</Link>{' '}
              runs the EBA’s package, header, key, foreign-key, closed-list and format rules on your zip or CSVs in your
              browser, under the EBA’s own rule codes, and exports its findings with the detailed-feedback.csv columns
              plus a severity column, so the two files can be compared line for line.
            </li>
            <li>
              <strong className="text-white">Rebuild the package, do not patch it.</strong> A new zip with a new
              creation timestamp in the file name, the same entityID and reference date in parameters.csv, all fifteen
              templates declared <Code>true</Code> in FilingIndicators.csv, every file UTF-8.
            </li>
            <li>
              <strong className="text-white">Resubmit to your competent authority,</strong> which forwards the file to
              the ESAs. Then wait for the RES file and work through the warnings: they do not reject, but they are what
              the authority will ask about.
            </li>
          </ol>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <H2 id="consequences">What happens if it is still wrong: the 2026 cycle</H2>
          <P>
            The register is collected once a year by each competent authority and forwarded to the ESAs. In the 2026
            cycle the data was as at 31 December 2025, and the authorities we checked set these windows (as of{' '}
            {CHECKED}):
          </P>
          <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 leading-7 text-[var(--text-dim)]">
            <li>
              <Cite s={SRC.cssf2026}>Luxembourg (CSSF), communiqué of 17 March 2026</Cite>: submission by 31 March 2026
              (30 June 2026 on a best-effort basis for third-country branches of credit institutions). The ESAs perform
              additional quality control checks throughout April 2026; an entity whose register fails them must fix the
              errors and resubmit to the CSSF, which forwards it again to the ESAs before the end of April. As of 16
              March, only 40% of the entities required to submit had done so.
            </li>
            <li>
              <Cite s={SRC.cbi2026}>Ireland (Central Bank of Ireland), page updated 29 January 2026</Cite>: data as at 31
              December 2025, submission window 2 to 31 March 2026 via the Central Bank Portal; technical validation in
              March, then the EBA runs data-quality checks on all registers in April, which can lead to a request to
              resubmit.
            </li>
            <li>
              <Cite s={SRC.mfsa2026}>Malta (MFSA), circular of 5 March 2026</Cite>: reporting period 1 January to 21 March
              2026; the ESAs’ additional checks in April 2026 can produce feedback on a register that already shows
              “Accepted” on the portal, with resubmission expected by 30 April 2026.
            </li>
          </ul>
          <P>
            Three things follow. A rejection in the last week of the window leaves you no time to correct and resubmit
            inside it. “Accepted” at the portal is the technical stage only; the April checks come afterwards. And the
            April checks in 2026 went beyond the 2025 rule list. The MFSA circular’s annex gives examples, and the{' '}
            <Cite s={SRC.caa}>annex to the CAA note of 15 April 2026</Cite> lists the full set, codes E001 to E023.
            They include a generic value such as “not applicable” or “LTD” as a provider name (E001, E002); a code
            containing DUMMY, INVALID or NOTAPPLICABLE, or equal to 0, NONE, TRUE or FALSE, as a provider or ultimate
            parent code (E003, E005), such as <Code>9999999DUMMY99999999</Code>; an identifier reported with its type
            inside the code, such as “GB_CRN_…” or “US EIN#…” (E006, E009); a code shorter than five characters (E012);
            an LEI that does not correspond to the provider name reported (E013); an ultimate parent code that does not
            match the parent GLEIF holds for that LEI (E018); and the same non-LEI code used for providers with
            different names (E022). The placeholder that gets you past 805 and 807 is now checked for being a
            placeholder.
          </P>
          <P>
            The next window is set by your authority’s communiqué for that year; the dates above are the ones we have
            verified for 2026, so check your authority’s current notice. The obligation itself is{' '}
            <Cite s={SRC.dora}>Article 28(3) of Regulation (EU) 2022/2554</Cite>; the templates and their keys are{' '}
            <Cite s={SRC.its}>Implementing Regulation (EU) 2024/2956</Cite>.
          </P>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-xl font-semibold text-white">Find these before the ESAs do</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              The DORA Register Checker runs rules 805, 806 and 807 against the taxonomy’s key list and all twenty-two
              references, plus the package, header, closed-list (503), date (330) and business-rule checks, on your
              zip, CSVs or Excel template. The checks run in your browser and the register is not uploaded; the one
              optional step that leaves the tab is a GLEIF lookup, which sends the LEI codes and nothing else. It names
              the reference (R1 to R22), the row and the value for each failure, and exports the result with the EBA’s
              detailed-feedback.csv columns. It also ships a fictional sample register with faults seeded, so you can
              see what a finding looks like before loading your own.
            </p>
            <div className="mt-6">
              <Button href="/dora-register">Check a register now</Button>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <H2 id="sources">Sources</H2>
            <P>Every document this page rests on, with the date it carries. All were fetched and read on {CHECKED}.</P>
            <ul className="mt-6 space-y-4">
              {Object.values(SRC).map((s) => (
                <li key={s.href} className="rule-fade pt-3">
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-display font-semibold text-white hover:text-[var(--blue-light)]">
                    {s.label}
                  </a>
                  <p className="mt-1 text-sm text-[var(--text-faint)]">{s.date}</p>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-24">
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
