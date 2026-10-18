import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { pageMetadata, SITE_URL } from '@/lib/site'

// The question this page answers: "When is the DORA Register of Information
// due to *our* regulator, and which reference date, portal and format apply?"
// Every national authority publishes only its own window; the law-firm and
// vendor posts restate one country each. The table below is the only place
// the official rows sit side by side, and every cell links to the authority's
// own page with the date we read it.
//
// Facts rule: nothing on this page comes from a secondary source. Where an
// authority has not published a figure, the cell says so rather than guessing.

const PATH = '/guides/dora-register-of-information-deadline-by-country'
const AS_OF = '18 October 2026'

export const metadata = pageMetadata({
  title: 'DORA Register of Information deadlines by NCA',
  ogTitle: 'When is the DORA Register of Information due to your regulator?',
  description:
    'DORA Register of Information: 2026 submission windows, reference date, portal and file format for BaFin, DNB, NBB, CSSF, Central Bank of Ireland, ACPR, MFSA and FMA.',
  path: PATH,
  keywords: [
    'dora register of information 2026 deadline',
    'dora roi submission date 2026',
    'cssf dora register of information 2026',
    'bafin dora register of information',
    'dnb dora information register',
    'central bank of ireland dora register of information',
    'acpr registre d\'informations dora 2026',
    'nbb dora_roi onegate',
    'DORA register of information reference date',
    'DORA register of information xBRL-CSV',
  ],
})

// ---------------------------------------------------------------- sources ---
// One entry per document we actually opened. `read` is the day we read it;
// `published` is the authority's own date on the document.

const SOURCES = {
  dnb: {
    name: 'DNB, "DORA reporting: DORA registers of information in March 2026"',
    published: '3 February 2026',
    href: 'https://www.dnb.nl/en/sector-news/supervision-2026/dora-reporting-dora-registers-of-information-in-march-2026/',
  },
  cssf: {
    name: 'CSSF, "DORA – Submission timeframe for register of information – eDesk Portal open as of 11 February 2026"',
    published: '11 February 2026',
    href: 'https://www.cssf.lu/en/2026/02/dora-submission-timeframe-for-register-of-information-edesk-portal-open-as-of-11-february-2026/',
  },
  cssfUpdate: {
    name: 'CSSF, "DORA – Register of Information collection – Update"',
    published: '17 March 2026',
    href: 'https://www.cssf.lu/en/2026/03/dora-register-of-information-collection/',
  },
  cssfBranches: {
    name: 'CSSF, "DORA – Submission timeframe for register of information for third-country branches of credit institutions having their head office in a third country"',
    published: '17 February 2026',
    href: 'https://www.cssf.lu/en/2026/02/dora-submission-timeframe-for-register-of-information-for-third-country-branches-of-credit-institutions-having-their-head-office-in-a-third-country/',
  },
  cbi: {
    name: 'Central Bank of Ireland, "Reporting Registers of Information"',
    published: 'updated 29 January 2026',
    href: 'https://centralbank.ie/regulation/digital-operational-resilience-act-dora/reporting-registers-of-information',
  },
  nbb: {
    name: 'National Bank of Belgium, OneGate documentation, "DOR domain" (news entry of 28 January 2026)',
    published: '28 January 2026',
    href: 'https://www.nbb.be/en/reporting/onegate-reporting/general-access-onegate/onegate-documentation/dor-domain',
  },
  acprFaq: {
    name: 'ACPR, "FAQ sur la directive et le règlement DORA" (questions Q-B3 and Q-B6)',
    published: 'read 18 October 2026',
    href: 'https://acpr.banque-france.fr/fr/reglementation/focus-sur-la-reglementation/transverse/digital-operational-resilience-act-dora/faq-sur-la-directive-et-le-reglement-dora',
  },
  acprWebinar: {
    name: 'ACPR webinar slides, "Webinaire DORA", section 1, "Collecte des registres d’information" (PDF)',
    published: '23 January 2026',
    href: 'https://acpr.banque-france.fr/system/files/2026-01/20260123_webinaire_DORA.pdf',
  },
  bafin: {
    name: 'BaFin, "Informationsregister und Anzeigepflichten"',
    published: 'read 18 October 2026',
    href: 'https://www.bafin.de/DE/unternehmen-maerkte/aufsicht/alle-unternehmen/dora/Informationsregister_und_Anzeigepflichten/Informationsregister_und_Anzeigepflichten_node.html',
  },
  bafinHinweise: {
    name: 'BaFin, "DORA Informationsregister – Hinweise für die Einreichung über das BaFin MVP Portal" (PDF)',
    published: 'Stand 4 March 2026',
    href: 'https://www.bafin.de/SharedDocs/Downloads/DE/Anlage/Hinweise_fuer_die_Einreichung_des_Informationsregisters.pdf?__blob=publicationFile&v=1',
  },
  bafinFaq: {
    name: 'BaFin FAQ, "Wann muss das Informationsregister eingereicht werden?"',
    published: 'read 18 October 2026',
    href: 'https://www.bafin.de/SharedDocs/FAQs/DE/DORA/Informationsregister_und_Anzeigepflichten/1_Allgemeines/01.html',
  },
  bafinWorkshop: {
    name: 'BaFin workshop slides, "Informationsregister: Einreichungsprozess 2026" (PDF)',
    published: 'February 2026',
    href: 'https://www.bafin.de/SharedDocs/Downloads/DE/Veranstaltung/dl_workshop_einreichung_der_informationsregister_2026.pdf?__blob=publicationFile&v=2',
  },
  mfsaTimelines: {
    name: 'MFSA circular, "Register of Information Reporting Timelines for the Year 2026 and Onwards" (PDF)',
    published: '3 November 2025',
    href: 'https://www.mfsa.mt/wp-content/uploads/2025/11/Regulation-EU-20222554-on-Digital-Operational-Resilience-for-the-Financial-Sector-%E2%80%93-Register-of-Information-Reporting-Timelines-for-the-Year-2026-and-Onwards.pdf',
  },
  mfsaDq: {
    name: 'MFSA circular, "Register of Information Additional Data Quality Checks | Year 2026" (PDF)',
    published: '5 March 2026',
    href: 'https://www.mfsa.mt/wp-content/uploads/2026/03/Regulation-EU-20222554-on-Digital-Operational-Resilience-for-the-Financial-Sector-%E2%80%93-Register-of-Information-Additional-Data-Quality-Checks-Year-2026.pdf',
  },
  fma: {
    name: 'FMA Liechtenstein, "Support page for the DORA information register (cut-off date December 31, 2025)"',
    published: '20 February 2026',
    href: 'https://www.fma-li.li/en/news/support-page-for-the-dora-information-register-cut-off-date-december-31-2025-1591',
  },
  eba: {
    name: 'EBA, "Preparations for reporting of DORA registers of information" (validation rules, FAQ, sample package)',
    published: 'rules updated 28 April 2025',
    href: 'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application',
  },
} as const

type SourceKey = keyof typeof SOURCES

function Cite({ s, label }: { s: SourceKey; label?: string }) {
  const src = SOURCES[s]
  return (
    <a
      href={src.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--blue-light)] hover:underline"
      title={`${src.name}, ${src.published}`}
    >
      {label ?? `source, ${src.published}`}
    </a>
  )
}

// ------------------------------------------------------------------ table ---
// One row per authority. "Window" is the authority's own wording for the 2026
// collection; "Rule for every year" is what the same authority says applies
// annually, so the row still answers the question after the 2026 window has
// closed. Cells without a published figure say "not published".

type Row = {
  nca: string
  country: string
  window2026: string
  everyYear: string
  reference: string
  portal: string
  format: string
  errors: string
  source: SourceKey
  extra?: SourceKey[]
}

const ROWS: Row[] = [
  {
    nca: 'BaFin',
    country: 'Germany',
    window2026: '9 to 30 March 2026. A complete register filed in that window meets it even if it has not yet passed every check; corrections to registers filed in time until 24 April 2026. Test submissions from 4 February 2026.',
    everyYear: 'Annually; the process must be completed “vollständig und fehlerfrei” by 31 March. BaFin announces the opening date on its website at the start of each year.',
    reference: '31 December 2025 (31 December of the previous year, every year).',
    portal: 'MVP-Portal, Fachverfahren “Digital Operational Resilience Act (DORA)”; test environment “TEST: Digital Operational Resilience Act (DORA)”.',
    format: 'Either a zip with the xBRL-CSV package matching the ESAs taxonomy, or the BaFin Excel template (current version only; the beta is no longer accepted).',
    errors: 'BaFin validates first, then the ESAs. BaFin’s DORA page says this can take up to 48 hours; its submission notes say the ESAs’ response can take several days. An error log (Fehlerprotokoll) means fix and resubmit. The obligation is met only when the ESAs have validated the register.',
    source: 'bafinHinweise',
    extra: ['bafin', 'bafinFaq'],
  },
  {
    nca: 'DNB',
    country: 'Netherlands',
    window2026: 'Request available from 2 March 2026; report by 20 March 2026.',
    everyYear: 'Not published as a standing rule; DNB announced the 2026 window on 3 February 2026.',
    reference: '31 December 2025.',
    portal: 'MyDNB, via the Reporting Service.',
    format: 'xBRL-CSV with a table-oriented layout, or DNB’s standardised Excel template, which DNB converts to xBRL-CSV; responsibility for accuracy and completeness stays with the institution. DNB says taxonomy and template are unchanged from 2025.',
    errors: 'Technical and validation checks after 20 March; DNB informs you of the result and, where necessary, asks you to rectify and resubmit.',
    source: 'dnb',
  },
  {
    nca: 'NBB',
    country: 'Belgium',
    window2026: 'Production environment open from 16 February 2026; deadline 13 March 2026. Test environment from 2 February 2026.',
    everyYear: 'Not published as a standing rule on the OneGate page.',
    reference: '31 December 2025.',
    portal: 'OneGate, report DORA_ROI. The reporting entity is identified by its company number (CBE) with an .IND or .CON extension.',
    format: 'XBRL CSV or XBRL XML upload, or manual data entry in OneGate.',
    errors: 'Submit in OneGate TEST/UAT first, and in production only once the register passes all NBB and European validation checks there.',
    source: 'nbb',
  },
  {
    nca: 'CSSF',
    country: 'Luxembourg',
    window2026: '11 February to 31 March 2026. Third-country branches of credit institutions with a third-country head office: extended to 30 June 2026, best-effort.',
    everyYear: 'Annually, under Circular CSSF 25/882. The CSSF communiqué of 17 February 2026 refers to “the submission of 31 March 2027” for third-country branches.',
    reference: '31 December 2025: all contractual arrangements contracted until that date.',
    portal: 'eDesk, procedure “Submission of the Register of Information”. The entity’s LEI must be on file with the CSSF and the “DORA Reporting” role assigned to at least one employee first.',
    format: 'Plain-CSV files in a zip with the ESAs’ folder structure and file-naming convention. No Excel route is mentioned.',
    errors: 'CSSF checks the upload; if errors are found you are invited to fix and resubmit before 31 March. The ESAs then run further checks throughout April 2026; a register they refuse is fixed, resubmitted to the CSSF and forwarded again before the end of April. The 2025 rules are unchanged but applied to more fields, so a register accepted in 2025 can be rejected in 2026. On 16 March 2026 only 40% of entities due to file with the CSSF had done so.',
    source: 'cssf',
    extra: ['cssfUpdate', 'cssfBranches'],
  },
  {
    nca: 'Central Bank of Ireland',
    country: 'Ireland',
    window2026: '2 to 31 March 2026, with EBA technical feedback addressed and the register resubmitted before 31 March. (The same page’s note on the April review says 1 to 31 March; its “Upcoming Submission Date” section says 2 March.)',
    everyYear: 'The page describes the 2026 window as the same process as 2025; no standing rule is stated.',
    reference: '31 December 2025 (“reference/reporting date”).',
    portal: 'Central Bank Portal. Multiple errors are now displayed at once; the naming requirement for the zip is shown on the upload screen.',
    format: 'XBRL OIM-CSV in accordance with EBA DPM 4.0, saved as a zip. The ESAs provide no template or conversion tool for the official submission.',
    errors: 'Portal errors must be fixed and the file resubmitted inside the window. In April 2026 the EBA runs data-quality checks on all registers, which can trigger a further resubmission request.',
    source: 'cbi',
  },
  {
    nca: 'ACPR',
    country: 'France',
    window2026: 'Platform open from 1 January 2026; deadline 31 March 2026.',
    everyYear: 'Annually, under ACPR instruction no. 2025-I-12 and the ESAs’ decision of 8 November 2024: reference date 31 December of year N-1, submitted no later than 31 March of year N.',
    reference: '31 December 2025 (“date d’arrêté”).',
    portal: 'OneGate, domain DRB (banking) or DRA (insurance); accreditation with the entity’s LEI via the SURFI or SOLVA collection, separately for production and test.',
    format: 'Plain CSV (xBRL-CSV) in a .zip, base64-encoded inside an XML envelope for upload.',
    errors: 'Check the processing report (compte rendu de traitement) in OneGate for each upload. The ACPR may chase missing or failed registers after 31 March. First on its list of main technical rejections: the deadline (31/03/2026) entered as the reference date instead of 2025-12-31.',
    source: 'acprWebinar',
    extra: ['acprFaq'],
  },
  {
    nca: 'MFSA',
    country: 'Malta',
    window2026: '1 January to 21 March 2026 (both days included).',
    everyYear: '1 January (or next working day) to 21 March (or next working day) of every reporting year, from 2026 onwards.',
    reference: '31 December of the calendar year before the reporting period (31 December 2025 for 2026).',
    portal: 'LH Portal, RoI project. Access is requested by e-mail to the MFSA with the person’s name, designation and portal e-mail.',
    format: 'DORA-compliant plain-csv package; the MFSA states it is not an XBRL provider and cannot convert or alter submissions.',
    errors: 'Only the status “Accepted” on the LH Portal counts as compliant. Failure to reach it inside the period “may result in regulatory action” under L.N. 166 of 2024 and the MFSA Act. Even an Accepted register can fail the ESAs’ April 2026 data-quality checks; resubmission is then expected by 30 April 2026.',
    source: 'mfsaTimelines',
    extra: ['mfsaDq'],
  },
  {
    nca: 'FMA',
    country: 'Liechtenstein',
    window2026: '18 February to 18 March 2026.',
    everyYear: 'Not published as a standing rule.',
    reference: '31 December 2025 (“cut-off date”).',
    portal: 'FMA e-Service Portal.',
    format: 'Not stated on the support page; the FMA points to the ESAs’ information-register pages for format.',
    errors: 'Data-quality tests by the ESAs and the FMA after the deadline “may lead to cancellations and new submissions of reports in April 2026”.',
    source: 'fma',
  },
]

// ------------------------------------------------------------------ steps ---

const STEPS: [string, string][] = [
  [
    'Work out which authority, and at which level',
    'The register goes to the authority that supervises the reporting entity. DNB’s rule is typical: a stand-alone entity reports at entity level; a group reports at the highest EU consolidation level. Banks directly supervised by the ECB are outside these national collections: DNB says they report at consolidated level to the ECB, the MFSA says they are guided by the ECB, and the CSSF and ACPR exclude them from their own collections. In Luxembourg, third-country branches now report too, following ESAs Q&A DORA102 (3097) (CSSF, 11 and 17 February 2026).',
  ],
  [
    'Get portal access before the window opens',
    'CSSF needs your LEI on file and a “DORA Reporting” role assigned in eDesk. BaFin needs MVP registration and the DORA Fachverfahren approved; test submissions were open from 4 February 2026. MFSA needs the RoI project on your LH Portal account, requested by e-mail. ACPR needs OneGate accreditation to the DRB or DRA domain. NBB wants the register through OneGate TEST/UAT before production. The CSSF and the Central Bank of Ireland both tell entities to submit as early as possible, and BaFin reports that in 2025 several attempts per register were the norm.',
  ],
  [
    'Set the reference date everywhere it appears',
    'A 2025 register re-used in 2026 fails if the dates are not moved. For an xBRL-CSV package that means parameters.csv and the reference date in the zip and folder name; for an Excel template it is the header tab. BaFin also lists date fields inside the tables to refresh (B.01.01.0060, B.01.02.0070, B.06.01.0070, B.07.01.0070 among them). The ACPR’s first-listed rejection is the deadline entered in place of the reference date.',
  ],
  [
    'Run the EBA validation rules before you upload',
    'The EBA’s overview of checks was last updated on 28 April 2025, and the CSSF says the rules have not changed but are now applied to more fields. Among them: missing or duplicate keys (805, 806), broken cross-references between tables (807) and values outside a closed list (503). Our checker runs these rule families in your browser, with nothing uploaded, adds LEI check-digit tests, and exports a findings file laid out like the ESAs’ detailed-feedback.csv.',
  ],
  [
    'Submit early in the window, then watch for two rounds of feedback',
    'The first round is technical, from the authority and then the ESAs; BaFin quotes up to 48 hours on its DORA page and several days for the ESAs in its submission notes, the CSSF says “in due time”. The second round is the April data-quality review announced by the EBA in the week of 16 February 2026, which looks at content; the Central Bank of Ireland’s examples are a dummy LEI for an ultimate parent and “not applicable” as a provider name. Both rounds can require a resubmission. The CSSF asks for the eDesk tracing code in any helpdesk query about a submitted register, so keep it.',
  ],
  [
    'Close the process, not just the upload',
    'BaFin: the obligation is met when the ESAs’ instance-status.csv reads “No findings found”, or only findings the EBA FAQ treats as immaterial remain (the MVP status stays blue, it never turns green). MFSA: the LH Portal status must read “Accepted”, and the April checks can still ask for a resubmission by 30 April. CSSF: an ESAs refusal after CSSF acceptance still requires a fix and a fresh submission before the end of April. ACPR: read the processing report in OneGate for every upload.',
  ],
]

// -------------------------------------------------------------------- FAQ ---

const FAQ = [
  {
    q: 'When is the DORA Register of Information due in 2026?',
    a: 'It depends on the national competent authority. For the 2026 collection the published windows were: BaFin (Germany) 9 to 30 March 2026, with corrections until 24 April; DNB (Netherlands) by 20 March 2026, request open from 2 March; NBB (Belgium) by 13 March 2026, production open from 16 February; CSSF (Luxembourg) 11 February to 31 March 2026, and 30 June 2026 for third-country branches of credit institutions; Central Bank of Ireland 2 to 31 March 2026; ACPR (France) 1 January to 31 March 2026; MFSA (Malta) 1 January to 21 March 2026; FMA (Liechtenstein) 18 February to 18 March 2026. All eight used 31 December 2025 as the reference date. Under the ESAs’ decision of 8 November 2024, as the MFSA cites it, authorities forward the registers to the ESAs by the end of March; BaFin’s FAQ gives the same 31 March date from 2026.',
  },
  {
    q: 'What is the reference date for the DORA register of information?',
    a: 'From 2026 onwards the reference date is 31 December of the previous calendar year, so the 2026 submission covers contractual arrangements as at 31 December 2025. BaFin, the ACPR and the MFSA state this as a standing rule; the ACPR attributes it to the ESAs’ decision of 8 November 2024 (ESA 2024 22) and its own instruction 2025-I-12. The other authorities state 31 December 2025 for 2026. The 2025 collection was different: its reference date was 31 March 2025, according to BaFin’s FAQ.',
  },
  {
    q: 'Which file format does the register of information have to be in?',
    a: 'The package the ESAs define is a zip of plain CSV files in the xBRL-CSV (XBRL OIM-CSV) layout of the EBA DPM 4.0 taxonomy; BaFin’s slides show report.json, parameters.csv, FilingIndicators.csv and one CSV per table inside a root folder named like the zip. The CSSF, the Central Bank of Ireland and the MFSA name only that package. The ACPR wants the same zip, base64-encoded inside an XML envelope. BaFin and DNB also accept their own Excel template and convert it; DNB states that the institution stays responsible for the converted content. The NBB also accepts XBRL XML and manual entry in OneGate.',
  },
  {
    q: 'What happens if the register of information is submitted late or rejected?',
    a: 'A rejected register does not count as submitted. BaFin states the reporting obligation is fulfilled only once the ESAs have validated the register; MFSA states that only an “Accepted” status on its portal is DORA-compliant and that failing to reach it inside the reporting period may result in regulatory action; CSSF asks for a fixed register before 31 March and again if the ESAs refuse it afterwards. DNB, the Central Bank of Ireland and the FMA all describe a request to rectify and resubmit; the ACPR says it may chase missing or failed registers after 31 March. None of the eight authorities publishes a fixed fine amount for a late register on these pages.',
  },
  {
    q: 'Is there a second validation round after the deadline?',
    a: 'Yes, from 2026. The Central Bank of Ireland reports that the EBA announced, in the week of 16 February 2026, an additional data-quality review of register content in April 2026. MFSA’s circular of 5 March 2026 says the ESAs will run these checks during April 2026 and that resubmissions are expected by 30 April 2026, even for registers already marked Accepted. The CSSF says the ESAs check throughout April and refused registers go back to them before the end of April. BaFin allows corrections until 24 April 2026 and FMA warns of “cancellations and new submissions” in April 2026. The Central Bank of Ireland’s examples: a dummy LEI such as 9999999DUMMY99999999 for an ultimate parent, or “not applicable” as a provider name.',
  },
  {
    q: 'Do ECB-supervised banks submit the register to their national authority?',
    a: 'No. DNB states that banks under the direct supervision of the ECB report their register at consolidated level to the ECB. MFSA says significant credit institutions under Article 6(4) of Regulation (EU) No 1024/2013 are guided by the ECB, and the CSSF communiqué and the ACPR FAQ both exclude entities under the direct supervision of the ECB from their own collections.',
  },
  {
    q: 'Has any authority published the 2027 window yet?',
    a: `As of ${AS_OF}, no authority on this page has published a full 2027 window. BaFin says it announces the opening date at the start of each year, that the process must be completed by 31 March, and that no taxonomy changes are planned for the 2027 cycle. MFSA’s standing rule is 1 January to 21 March of every reporting year, and the ACPR’s is no later than 31 March of each year. The CSSF communiqué of 17 February 2026 refers to “the submission of 31 March 2027” for third-country branches. We will update the table when the authorities publish.`,
  },
]

function ArticleStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'DORA Register of Information deadlines by national regulator',
    description: metadata.description,
    url: `${SITE_URL}${PATH}`,
    dateModified: '2026-10-18',
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'Analytics Ascent', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Analytics Ascent', url: SITE_URL },
    about: ['DORA', 'Register of Information', 'ICT third-party risk'],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}

export default function DoraRegisterDeadlineGuide() {
  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'DORA Register Checker', path: '/dora-register' },
          { name: 'Deadlines by regulator', path: PATH },
        ]}
      />
      <ArticleStructuredData />

      <PageIntro eyebrow={`Guide · as of ${AS_OF}`} title="When is the DORA Register of Information due to your regulator?">
        <p>
          Each national authority sets its own window, and only the window matters. For the 2026 collection
          BaFin opened 9 to 30 March, DNB closed on 20 March, the NBB on 13 March, the CSSF ran 11 February to
          31 March, the Central Bank of Ireland 2 to 31 March, the ACPR 1 January to 31 March, the MFSA 1 January
          to 21 March and the FMA 18 February to 18 March. All eight used 31 December 2025 as the reference date,
          and every one that names a format accepts the ESAs’ xBRL-CSV zip. Those windows have closed; the table
          gives each authority’s standing rule for the next cycle where it has published one, with the official
          page and its date in every row.
        </p>
      </PageIntro>

      {/* ------------------------------------------------------------ table --- */}
      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <h2 className="font-display text-2xl font-medium text-white">Eight regulators, one table</h2>
          <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
            Every cell is a paraphrase of the authority’s own page. The source link in each row opens that page;
            the hover text shows the document and its date. Cells say “not published” where we found nothing.
          </p>
        </FadeIn>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-card)]">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line-bright)] text-xs uppercase tracking-wide text-[var(--text-faint)]">
                <th scope="col" className="px-4 py-3 font-semibold">Regulator</th>
                <th scope="col" className="px-4 py-3 font-semibold">2026 window</th>
                <th scope="col" className="px-4 py-3 font-semibold">Rule for every year</th>
                <th scope="col" className="px-4 py-3 font-semibold">Reference date</th>
                <th scope="col" className="px-4 py-3 font-semibold">Portal</th>
                <th scope="col" className="px-4 py-3 font-semibold">Accepted format</th>
                <th scope="col" className="px-4 py-3 font-semibold">If it fails</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.nca} className="border-t border-[var(--line)] align-top">
                  <th scope="row" className="px-4 py-4 font-display font-semibold text-white">
                    {r.nca}
                    <span className="mt-1 block text-xs font-normal text-[var(--text-faint)]">{r.country}</span>
                    <span className="mt-2 block text-xs font-normal">
                      <Cite s={r.source} />
                      {r.extra?.map((e) => (
                        <span key={e}>
                          {' · '}
                          <Cite s={e} />
                        </span>
                      ))}
                    </span>
                  </th>
                  <td className="px-4 py-4 text-white">{r.window2026}</td>
                  <td className="px-4 py-4 text-[var(--text-dim)]">{r.everyYear}</td>
                  <td className="px-4 py-4 text-[var(--text-dim)]">{r.reference}</td>
                  <td className="px-4 py-4 text-[var(--text-dim)]">{r.portal}</td>
                  <td className="px-4 py-4 text-[var(--text-dim)]">{r.format}</td>
                  <td className="px-4 py-4 text-[var(--text-dim)]">{r.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FadeIn>
          <p className="mt-4 text-sm text-[var(--text-faint)]">
            Not on this page: authorities whose 2026 page we have not read ourselves. We add a row only when we
            have the official text. If your regulator is missing, expect the same frame, since the ESAs’ decision
            has authorities forward registers by the end of March with a 31 December reference date, but take the
            window from the authority’s own DORA page.
          </p>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------- the tool --- */}
      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-8 sm:p-10">
            <h2 className="font-display text-xl font-semibold text-white">Before the window: run the EBA rules on your file</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              BaFin’s February 2026 workshop slides say several attempts per register were the norm in 2025, and
              that, according to the EBA, 70% of German registers were error-free, 28% had possibly minor errors and
              2% were rejected as “not OK”. Most technical rejections are mechanical, so they can be found before the
              upload. Our checker runs the EBA’s key, cross-reference and closed-list rules, plus LEI check digits,
              on your zip, CSVs or Excel template in your browser, with nothing uploaded, and exports its findings in
              the layout of the ESAs’ detailed-feedback.csv.
            </p>
            <div className="mt-6">
              <Link
                href="/dora-register"
                className="inline-flex items-center rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)]"
              >
                Check a register of information
              </Link>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------ what it is --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">What is being asked for, and by whom</h2>
            <div className="mt-6 grid gap-x-12 gap-y-6 text-[var(--text-dim)] lg:grid-cols-2">
              <p>
                <span className="text-white">The obligation.</span> Article 28(3) of Regulation (EU) 2022/2554
                (DORA) requires every financial entity to maintain a register of information on all contractual
                arrangements for ICT services, at entity level and at sub-consolidated and consolidated level, and
                to make it available to its competent authority. The templates are set by Implementing Regulation
                (EU) 2024/2956. The CSSF, BaFin and MFSA pages all open with this article.
              </p>
              <p>
                <span className="text-white">Why there is a date at all.</span> The ESAs use the registers to
                designate critical ICT third-party providers each year. The MFSA circular of 3 November 2025 cites the
                ESAs’ decision of 8 November 2024: competent authorities forward the full registers to the ESAs by
                the end of March of every reporting year. The ACPR’s FAQ cites the same decision for annual
                submission with a 31 December reference date, and BaFin’s FAQ states the 31 March forwarding date
                from 2026, with a reference date of 31 December of the previous year. Each
                national window is set to land before that. <Cite s="mfsaTimelines" label="MFSA, 3 November 2025" /> ·{' '}
                <Cite s="acprFaq" label="ACPR FAQ" /> · <Cite s="bafinFaq" label="BaFin FAQ" />
              </p>
              <p>
                <span className="text-white">What changed from 2025.</span> The 2025 collection used 31 March 2025 as
                the reference date and a 30 April 2025 forwarding date; 2026 moved both earlier. The taxonomy and the
                validation rules did not change: BaFin’s workshop slides say the EBA changed neither the data model
                nor the file structure, and the CSSF says the April 2025 rules are unchanged but now applied to
                more fields. <Cite s="bafinFaq" label="BaFin FAQ" /> · <Cite s="bafinWorkshop" label="BaFin, February 2026" /> ·{' '}
                <Cite s="cssf" label="CSSF, 11 February 2026" />
              </p>
              <p>
                <span className="text-white">No empty register.</span> BaFin states that an empty submission is not
                technically possible, because operating without any ICT third-party service is practically
                impossible; an entity convinced it has none is told to inform its supervisor proactively. <Cite s="bafinWorkshop" label="BaFin, February 2026" />
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* --------------------------------------------------- consequences --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">What happens if you get it wrong</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              None of the eight authorities prints a fine amount for a late register on these pages, and we do not
              invent one. What they do say is precise about what counts as submitted.
            </p>
            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {[
                ['A rejected upload is not a submission', 'BaFin: “Erst, wenn auch die ESAs Ihr Register validiert haben, sind Sie Ihrer Meldepflicht ordnungsgemäß nachgekommen.” MFSA: a submission is DORA-compliant only once it shows “Accepted” on the LH Portal; a fully validated register not accepted inside the reporting period “may result in regulatory action by the Authority by virtue of the L.N. 166 of 2024 and the MFSA Act”.', 'bafin', 'mfsaTimelines'],
                ['The ESAs can reject what your authority accepted', 'CSSF: registers it accepts are sent to the ESAs, who run additional checks; if the ESAs refuse, you fix, resubmit to the CSSF, and the CSSF forwards again. BaFin: the ESAs’ rule set is larger than BaFin’s, so a file BaFin passed can still come back REJECTED (NOK) with a detailed-feedback.csv listing the errors.', 'cssf', 'bafinHinweise'],
                ['Last year’s accepted file can fail this year', 'CSSF: the same rules are applied to more data fields in 2026, “therefore, in certain cases, a register of information which was accepted last year, may be rejected this year”. BaFin lists the date fields that must be refreshed before re-use.', 'cssf', 'bafinWorkshop'],
                ['April brings a second, content-level round', 'Central Bank of Ireland: the EBA announced in the week of 16 February 2026 a data-quality review in April 2026, producing additional feedback on register content. MFSA: resubmission expected by 30 April 2026, even after an Accepted status. CSSF: ESAs checks throughout April, refused registers back to the ESAs before the end of April. BaFin: corrections until 24 April 2026, and the EBA production systems close on 30 April 2026. FMA: possible “cancellations and new submissions” in April.', 'cbi', 'mfsaDq'],
              ].map(([title, detail, s1, s2]) => (
                <div key={title} className="border-t border-[var(--line)] pt-4">
                  <dt className="font-display font-semibold text-white">{title}</dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                    {detail}{' '}
                    <Cite s={s1 as SourceKey} label="source" /> · <Cite s={s2 as SourceKey} label="source" />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeIn>
      </Container>

      {/* ---------------------------------------------------------- steps --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">How to get it accepted, step by step</h2>
            <ol className="mt-10 space-y-8">
              {STEPS.map(([title, detail], i) => (
                <li key={title} className="rule-fade grid gap-3 pt-5 sm:grid-cols-[3rem_1fr]">
                  <span className="font-display text-2xl font-medium text-[var(--text-faint)]">{i + 1}</span>
                  <div>
                    <h3 className="font-display font-semibold text-white">{title}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">
                      {detail}
                      {i === 3 && (
                        <>
                          {' '}
                          <Link href="/dora-register" className="text-[var(--blue-light)] hover:underline">
                            Run the checker
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </FadeIn>
      </Container>

      {/* -------------------------------------------------- worked example --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Worked example: a BaFin-supervised entity in the 2026 cycle
            </h2>
            <p className="mt-5 max-w-3xl text-[var(--text-dim)]">
              Every date and file name below is taken from BaFin’s own submission guidance and workshop slides, so the
              example can be checked line by line.
            </p>
            <dl className="mt-8 space-y-5 text-sm">
              {[
                ['Reference date', '31 December 2025. The entity re-uses its 2025 register, so parameters.csv, the zip and folder names and the in-table date fields are moved from 2025-03-31 to 2025-12-31.'],
                ['File name', 'BaFin’s example for an individual-level xBRL package is DUMMYLEI123456789012.IND_DE_DORA010100_DORA_2025-12-31_20260318121215010.zip, with parameters.csv inside the Reports folder. The Excel route uses the same stem with .xlsm.'],
                ['Test', 'From 4 February 2026 the file is uploaded to “TEST: Digital Operational Resilience Act (DORA)” in the MVP-Portal. BaFin offers the test procedure so entities can prepare for the 2026 submission; the formal filing goes through the production procedure.'],
                ['Submission', 'Between 9 and 30 March 2026 the file goes to the production Fachverfahren. Status “In Verarbeitung”, then “In Verarbeitung (extern)” once forwarded to the ESAs. BaFin’s DORA page says validation can take up to 48 hours; its submission notes say the ESAs’ response can take several days. A complete register filed in the window meets the deadline even if it has not yet passed every check.'],
                ['Feedback', 'The ESAs return a zip with instance-status.csv and detailed-feedback.csv. REJECTED (NOK) means at least one technical error: fix and resubmit. A Validation Result with findings usually also means resubmit, unless the only findings are ones the EBA FAQ treats as immaterial, such as a provider that has no LEI and is identified by another code.'],
                ['Close-out', 'A Validation Result whose instance-status.csv reads “No findings found” ends the process. Corrections to registers filed in the window are accepted until 24 April 2026; the EBA systems close on 30 April 2026. The MVP status remains blue; it does not turn green.'],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
                  <dt className="font-display font-semibold text-white">{k}</dt>
                  <dd className="text-[var(--text-dim)]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-[var(--text-faint)]">
              <Cite s="bafinHinweise" label="BaFin, Hinweise für die Einreichung, Stand 4 March 2026" /> ·{' '}
              <Cite s="bafinWorkshop" label="BaFin workshop slides, February 2026" />
            </p>
          </div>
        </FadeIn>
      </Container>

      {/* ---------------------------------------------------------- next --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">The next cycle</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              As of {AS_OF} no authority on this page has published a complete window for the next collection.
              What is already on record: BaFin will announce its opening date at the start of the year, requires
              the process to be complete and error-free by 31 March, and plans no taxonomy changes for the 2027
              cycle; the MFSA’s standing period is 1 January to 21 March of every reporting year; the ACPR’s FAQ
              says no later than 31 March of each year; the CSSF’s
              17 February 2026 communiqué refers to “the submission of 31 March 2027” for third-country branches.
              The reference date rule, 31 December of the previous year, comes from the ESAs’ decision and is
              stated as a standing rule by BaFin, the ACPR and the MFSA. We update
              this page when the authorities publish; the “as of” date at the top is the day we last checked.
            </p>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------- sources --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">Sources, all official, all dated</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              We read each of these on {AS_OF}. Nothing on this page comes from a law-firm note or a vendor
              blog. If a cell above disagrees with the document, the document wins; tell us and we will fix it.
            </p>
            <ul className="mt-8 space-y-4">
              {(Object.keys(SOURCES) as SourceKey[]).map((k) => (
                <li key={k} className="rule-fade pt-3 text-sm">
                  <a
                    href={SOURCES[k].href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display font-semibold text-white hover:text-[var(--blue-light)]"
                  >
                    {SOURCES[k].name}
                  </a>
                  <span className="ml-2 text-[var(--text-faint)]">{SOURCES[k].published}</span>
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
