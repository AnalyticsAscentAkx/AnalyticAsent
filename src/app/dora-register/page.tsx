import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { SoftwareStructuredData } from '@/components/StructuredData'
import { CTPPS } from '@/lib/dora/reference'
import { DRY_RUN_FAILURES, DRY_RUN_MISSING_BY_TEMPLATE, DRY_RUN_SOURCE, LANDSCAPE, LANDSCAPE_SOURCE } from '@/lib/dora/benchmark'
import { CompareBars } from '@/components/Charts'
import { pageMetadata } from '@/lib/site'
import { Checker } from './Checker'

// "Register of information" is what people type, with "template", "validation
// rules", "data model" and "example" as the expansions Google Suggest returns.
// "DORA RoI" is the insiders' abbreviation. The title carries both.
export const metadata = pageMetadata({
  title: 'DORA Register of Information checker',
  ogTitle: 'Check a DORA Register of Information before you submit it',
  description:
    'Check a DORA Register of Information against the EBA validation rules before you submit: keys, closed lists, LEIs, package format. In your browser; nothing uploaded.',
  path: '/dora-register',
  keywords: [
    'DORA register of information',
    'register of information template',
    'DORA validation rules',
    'EBA DORA validation rules',
    'DORA RoI',
    'register of information data model',
    'DORA ICT third party register',
    'register of information example',
    'DORA 2026 deadline',
  ],
})

const LAYERS: [string, string][] = [
  ['Package and file names', 'The zip name pattern, the root folder, META-INF, report.json, parameters.csv and FilingIndicators.csv with their exact headers, entityID and refPeriod agreeing with the file name, lower-case table names, UTF-8. Rules 103–115, 306, 701–724.'],
  ['Headers and rows', 'Only the column codes the taxonomy defines, none twice, none blank; every row with the same number of cells as the header; comma-separated, not semicolon. Rules 801, 802, 809.'],
  ['Keys', 'Key columns filled (805) and unique as a tuple (806), and all twenty-two foreign keys the taxonomy declares (807): contracts to B_02.01, entities to B_01.02, providers to B_05.01, functions to B_06.01, ultimate parents to their own row.'],
  ['Values', 'Dates as yyyy-mm-dd (330), integers without decimals (331), amounts as plain numbers (305), link columns true (333), and every enumerated cell drawn from its closed list with the eba_ prefix (503) — with a suggestion when the code is right and the prefix or case is wrong.'],
  ['Business rules', 'The DPM rules with warning severity: existence (e2xxxx_e), row-level mandatory fields (v88xx_m), the conditional rules on subsequent arrangements, total assets and substitutability reasons, sign rules, LEI format.'],
  ['Identifiers', 'ISO 17442 check digits on every LEI (the EBA regex passes a typo; the checksum does not), placeholders such as DUMMYLEI…, EUID structure, and the ITS rule that a legal person carries an LEI or EUID — which the DPM stopped enforcing in March 2025 but the regulation did not.'],
  ['What the ITS asks for but no rule enforces', 'Notice periods, governing law, data storage and reliance for services supporting critical functions; a B_07.01 assessment for each of them; an annual expense for every direct provider; contracts that end before they start. None of these is rejected. All of them are what the content review in April 2026 is about.'],
  ['GLEIF, on request', 'Existence and status of every LEI, the country check (VR_16), and a comparison of the names and ultimate parents the register declares with what each entity has filed with GLEIF. The only step that leaves the tab; it sends the LEIs and nothing else.'],
]

const SOURCES: [string, string, string][] = [
  ['EBA XBRL taxonomy 4.0, DORA module 1.1.0', 'The fifteen tables, every column type, primary and foreign keys and all closed lists — generated from the taxonomy files, not typed.', 'https://www.eba.europa.eu/risk-and-data-analysis/reporting/reporting-frameworks/reporting-framework-40'],
  ['EBA technical checks and validation rules for RoI reporting, 28 April 2025', 'The rule codes and severities, including the March 2025 deactivations.', 'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application'],
  ['ESAs RoI reporting FAQ, 28 March 2025', 'The placeholder conventions (9999-12-31, qx2007, "Not Applicable") and the empty-template rules.', 'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application'],
  ['EBA Filing Rules v5.5 and the plain-CSV package guide', 'File naming, folder layout, parameters.csv and FilingIndicators.csv.', 'https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application'],
  ['ESAs list of designated critical ICT third-party providers, 18 November 2025', 'Nineteen names. The ESAs publish no identifiers; the LEIs used to match them are listed below.', 'https://www.esma.europa.eu/press-news/esma-news/european-supervisory-authorities-designate-critical-ict-third-party-providers'],
  ['GLEIF Global LEI Index (CC0)', 'Live, from your browser, batched 200 at a time. Legal name, legal address, registration status, direct and ultimate parent.', 'https://www.gleif.org/en/lei-data/gleif-concatenated-file'],
  ['European Commission adequacy decisions', 'The country classification behind the data-location table.', 'https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en'],
  ['ESAs dry-run summary report (ESA 2024 35) and EBA observations from the 2025 collection', 'Which errors are common, and therefore which hints are worth writing.', 'https://www.esma.europa.eu/sites/default/files/2024-12/ESA_2024_35_DORA_Dry_Run_exercise_summary_report.pdf'],
]

const FAQ = [
  {
    q: 'What is the DORA register of information?',
    a: 'Under Article 28(3) of the Digital Operational Resilience Act, every financial entity in the EU must maintain a register of all its contractual arrangements with ICT third-party providers and report it to its competent authority on request, in practice once a year. The format is set by Implementing Regulation (EU) 2024/2956: fifteen linked templates (B_01.01 to B_99.01) covering the entities in scope, each contract, each provider and its ultimate parent, the functions the services support, their criticality, and a risk assessment of every service supporting a critical or important function.',
  },
  {
    q: 'What format does the register of information have to be submitted in?',
    a: 'What the ESAs receive is a zip containing plain CSV files in the xBRL-CSV layout: one lower-case file per template (b_01.01.csv … b_99.01.csv), plus report.json, parameters.csv and FilingIndicators.csv, inside a root folder named like the zip. The zip itself is named <LEI>.<CON|IND>_<country>_DORA010100_DORA_<reference date>_<timestamp>.zip. Several national authorities accept an Excel workbook and convert it to this package for you; the checks that matter are still run on the converted package.',
  },
  {
    q: 'What are the DORA validation rules?',
    a: 'The EBA publishes them as a spreadsheet, updated last on 28 April 2025. They come in four layers: technical checks on the package (rules 101–115 and 701–724, which reject the file), DPM technical checks on types, keys and closed lists (305–333, 503, 805–809, which also reject), DPM business validation rules on mandatory and conditional fields (the v88xx_m, e2xxxx_e and sign rules, which are warnings), and LEI and EUID checks against GLEIF and BRIS (VR_2 to VR_78, also warnings). The 2026 collection uses the same taxonomy and rules as 2025.',
  },
  {
    q: 'Why was my register rejected with error 807?',
    a: 'Rule 807 is a foreign-key failure: a value in one template must exist as a key in another, and does not. The most common case by far is an ultimate parent named in B_05.01 column c0110 that has no row of its own in B_05.01. Others are a contract reference used in B_02.02, B_03.xx, B_04.01, B_05.02 or B_07.01 that is missing from B_02.01, a function identifier in B_02.02 that is not defined in B_06.01 for the same entity, and a provider code with no row in B_05.01. The checker names the reference (R1 to R22) and the row.',
  },
  {
    q: 'Do I need an LEI for every ICT provider?',
    a: 'The ITS says a legal person is identified by an LEI or, for EU companies, an EUID; third-country legal persons by an LEI only; other codes (registration number, VAT, passport) only for individuals acting in a business capacity. The DPM rule enforcing this was switched off in March 2025, so a national code will not cause a rejection, but it remains what the regulation asks for and what supervisors have said they will follow up on. Where a provider genuinely has no identifier, the FAQ allows a placeholder to avoid a key failure; the checker flags those so you know how many you have.',
  },
  {
    q: 'Which ICT providers have been designated critical under DORA?',
    a: `On 18 November 2025 the three European Supervisory Authorities published the first list of critical ICT third-party providers under Article 31 DORA, nineteen in all: ${CTPPS.map((c) => c.name).join(', ')}. The EBA is lead overseer for all of them. The checker marks any of them that appear in a register.`,
  },
  {
    q: 'Is the register uploaded anywhere?',
    a: 'No. The zip, CSVs or workbook are read in your browser tab and every check runs there. The one optional step that leaves the tab is the GLEIF lookup, which sends the LEI codes found in the register, and nothing else, directly to api.gleif.org; GLEIF publishes the data under CC0 and the request does not pass through this site. Closing the tab is the deletion step.',
  },
  {
    q: 'What does this not check?',
    a: 'It does not query the Business Registers Interconnection System for EUIDs, which has no open interface, so EUIDs are checked for structure only. It does not know about checks a national portal adds on top of the EBA set, or how a portal converts an Excel template. It does not judge whether a function should have been classed as critical; it only says where the data is inconsistent with that classification. It is a checker, not legal advice.',
  },
]

export default function DoraRegister() {
  return (
    <RootLayout>
      <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Tools', path: '/tools' }, { name: 'DORA Register Checker', path: '/dora-register' }]} />
      <SoftwareStructuredData
        name="DORA Register Checker"
        description="Validate a DORA Register of Information against the EBA technical checks, key rules, closed lists and LEI checks before submission. Runs entirely in the browser."
        path="/dora-register"
      />
      <PageIntro eyebrow="Free, in your browser" title="Check a DORA Register of Information against the EBA validation rules">
        <p>
          In the regulators&apos; own dry run, 93.5% of registers failed at least one check. The rules are
          public; the taxonomy is public; the LEI index is public. This runs all of it on your register, in
          your browser, and hands back the same feedback file the EBA would, before you submit.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <Checker />
        </FadeIn>
      </Container>

      <div className="section-lift mt-24 py-20 sm:mt-32 sm:py-28">
        <Container>
          <FadeIn>
            <p className="text-sm font-semibold text-[var(--blue-light)]">The numbers behind the rules</p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Most registers fail on things a machine can see
            </h2>
          </FadeIn>
          <dl className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['93.5%', 'of the 947 registers in the ESAs’ 2024 dry run failed at least one data-quality check'],
              ['86%', 'of those failures were missing mandatory information, 60% of it in B_02.02'],
              ['58,170', 'EUIDs rejected on format alone in the 2025 collection'],
              ['19', 'ICT providers designated critical by the ESAs in November 2025'],
            ].map(([v, l]) => (
              <FadeIn key={l}>
                <div className="rule-fade pt-5">
                  <dd className="stat font-display text-4xl font-medium">{v}</dd>
                  <dt className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{l}</dt>
                </div>
              </FadeIn>
            ))}
          </dl>
          <div className="mt-14 grid gap-12 lg:grid-cols-2">
            <FadeIn>
              <h3 className="font-display text-lg font-semibold text-white">Where the dry-run failures fell</h3>
              <CompareBars
                points={DRY_RUN_FAILURES.map((f) => ({ label: f.label, value: Math.round(f.share * 1000) / 10, display: `${Math.round(f.share * 1000) / 10}%` }))}
                caption={`Share of the 235,000 failed checks across 947 registers, ${DRY_RUN_SOURCE.title}, ${DRY_RUN_SOURCE.date}. Only ${Math.round(DRY_RUN_SOURCE.passedAll * 1000) / 10}% of registers passed every check.`}
              />
              <CompareBars
                points={DRY_RUN_MISSING_BY_TEMPLATE.map((f) => ({ label: f.label, value: Math.round(f.share * 100), display: `${Math.round(f.share * 100)}%`, state: 'before' }))}
                caption="Within the missing-information failures, the template they were in. B_02.02 is the contract-by-service table and the largest; it is also where the key and foreign-key checks bite."
              />
            </FadeIn>
            <FadeIn>
              <h3 className="font-display text-lg font-semibold text-white">What EU financial entities buy, and how much of it is critical</h3>
              <CompareBars
                points={LANDSCAPE.map((c) => ({ label: c.label, value: c.arrangements, display: `${c.arrangements.toLocaleString('en-GB')} · ${Math.round(c.criticalShare * 100)}% critical` }))}
                caption={`Contractual arrangements by service category and the share supporting a critical or important function. ${LANDSCAPE_SOURCE.title}, ${LANDSCAPE_SOURCE.date}: ${LANDSCAPE_SOURCE.arrangements.toLocaleString('en-GB')} arrangements, ${LANDSCAPE_SOURCE.providers.toLocaleString('en-GB')} providers, about ${LANDSCAPE_SOURCE.entities.toLocaleString('en-GB')} entities, reference date end-2021. The checker compares a register's own critical share with these.`}
              />
            </FadeIn>
          </div>
          <FadeIn>
            <p className="mt-10 max-w-3xl text-sm text-[var(--text-faint)]">
              Sources: ESAs Dry Run summary report ESA 2024 35 (December 2024); ESAs report on the landscape of
              ICT third-party providers ESA 2023 22 (September 2023); EBA, Observations from RoI reporting —
              common issues (April 2025); ESAs press release of 18 November 2025. These are the only
              published EU-wide figures; the ESAs have released no statistics from the 2025 registers.
            </p>
          </FadeIn>
        </Container>
      </div>

      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">What it checks, in the order the EBA does</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              Rule codes are the EBA&apos;s, so the output reads against the official rule list and the official
              feedback file. Checks the EBA does not run carry an AA- prefix and say what they rest on.
            </p>
            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {LAYERS.map(([title, detail]) => (
                <div key={title} className="border-t border-[var(--line)] pt-4">
                  <dt className="font-display font-semibold text-white">{title}</dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">Built from public data, all of it dated</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              Everything the checker knows comes from a document or dataset anyone can download. The point
              of listing them is that you can check the checker.
            </p>
            <ul className="mt-10 space-y-6">
              {SOURCES.map(([name, what, href]) => (
                <li key={name} className="rule-fade pt-4">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="font-display font-semibold text-white hover:text-[var(--blue-light)]">
                    {name}
                  </a>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-dim)]">{what}</p>
                </li>
              ))}
            </ul>
            <details className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6">
              <summary className="cursor-pointer font-display font-semibold text-white">
                The nineteen designated providers, with the LEIs used to match them
              </summary>
              <p className="mt-3 text-sm text-[var(--text-dim)]">
                Names exactly as the ESAs printed them. The ESAs publish no identifiers; the LEIs were looked up in
                GLEIF by us on 7 October 2026. Four of the named entities have no LEI, so those are matched by name.
              </p>
              <table className="mt-4 w-full border-collapse text-sm">
                <tbody>
                  {CTPPS.map((c) => (
                    <tr key={c.name} className="border-t border-[var(--line)]">
                      <td className="py-2 pr-4 text-white">{c.name}</td>
                      <td className="py-2 pr-4 text-[var(--text-faint)]">{c.country}</td>
                      <td className="py-2 font-mono text-xs text-[var(--text-dim)]">{c.lei ?? 'no LEI on file'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-xl font-semibold text-white">Where this stops, and what comes next</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              This tells you whether the file will be accepted and where it contradicts itself. It cannot tell
              you whether the function you marked non-critical actually is, whether the expense figure is the
              contract value or the invoiced one, or what to do about the fact that a third of your critical
              services sit with one group. Those are the questions the register was meant to raise, and
              answering them from your own data — contracts, invoices, incident logs — is work we do.
            </p>
            <div className="mt-6">
              <Link href="/dora-services" className="inline-flex items-center rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)]">
                See the services and prices
              </Link>
            </div>
            <p className="mt-6 text-[var(--text-dim)]">
              The provider-to-parent resolution here is the same problem as{' '}
              <Link href="/datasets/who-owns-what" className="text-[var(--blue-light)] hover:underline">
                the ownership dataset
              </Link>
              , run on the entities in your register instead of a public one.
            </p>
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
