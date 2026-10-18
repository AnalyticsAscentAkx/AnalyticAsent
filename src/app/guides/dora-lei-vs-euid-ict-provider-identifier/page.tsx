import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { pageMetadata } from '@/lib/site'

// The question people type is "lei vs euid" / "dora euid" / "lei lapsed
// consequences". The results are LEI resellers, who have a reason to say a
// lapsed code is no code at all. Every rule on this page is quoted from the
// ITS, the ESAs' FAQ, the EBA's rule list or GLEIF's own definitions, each
// with its date, so the reader can check us instead of trusting us.
export const metadata = pageMetadata({
  title: 'DORA register: LEI or EUID for each ICT provider?',
  ogTitle: 'LEI or EUID for each ICT provider in the DORA register of information',
  description:
    'Which identifier each ICT provider needs in a DORA register, what to do for non-EU providers or a lapsed LEI, and which mistakes get the file rejected.',
  path: '/guides/dora-lei-vs-euid-ict-provider-identifier',
  keywords: [
    'LEI vs EUID',
    'DORA EUID',
    'DORA LEI requirement',
    'LEI EUID DORA',
    'lapsed LEI consequences',
    'LEI status lapsed meaning',
    'lapsed LEI renewal',
    'DORA register of information identifier',
    'B_05.01 identification code',
  ],
})

/** Checked on 18 October 2026. The date is printed, not computed, so the page
 *  never claims to be fresher than the last time someone actually looked. */
const CHECKED = '18 October 2026'

const SOURCES: { name: string; date: string; what: string; href: string }[] = [
  {
    name: 'Commission Implementing Regulation (EU) 2024/2956 (the ITS on the register of information)',
    date: 'adopted 29 November 2024, in the Official Journal 2 December 2024, in force 22 December 2024',
    what: 'Article 3(5) and 3(6) on identifiers, recital 9 on the EU-versus-third-country split, and the Annex I fill-in instructions for B_05.01.0010, 0020, 0030, 0040, 0110 and 0120.',
    href: 'https://eur-lex.europa.eu/eli/reg_impl/2024/2956/oj',
  },
  {
    name: 'Regulation (EU) 2022/2554 (DORA), Article 28(3)',
    date: 'applies from 17 January 2025',
    what: 'The obligation to maintain the register and make it available to the competent authority.',
    href: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
  },
  {
    name: 'ESAs respond to the European Commission’s rejection of the technical standards on the registers of information',
    date: '15 October 2024',
    what: 'Why the ITS allows an EUID at all: the Commission wanted the choice, the ESAs warned about data quality and asked that the LEI be preferred where both exist.',
    href: 'https://www.eiopa.europa.eu/esas-respond-european-commissions-rejection-technical-standards-registers-information-under-dora-and-2024-10-15_en',
  },
  {
    name: 'ESAs, Frequently asked questions on reporting of registers of information under DORA',
    date: 'version of 28 March 2025 (the latest linked from the EBA’s DORA page as of 18 October 2026)',
    what: 'Q39 to Q45 on identifiers, Q44 on lapsed LEIs, Q47 on the type-of-code values (listed under errors in the published ITS), Q120 on legal names. The ESAs answer these on a best-efforts basis; formal interpretations come through the Q&A process.',
    href: 'https://www.eba.europa.eu/sites/default/files/2025-03/31bb6e60-7d10-4405-a8c5-9f04934630ac/20250328%20-%20DORA%20RoI%20reporting%20FAQ%20%28updated%29.pdf',
  },
  {
    name: 'EBA Single Rulebook Q&A 2024_7283',
    date: 'final answer 28 March 2025',
    what: 'The formal answer on B_05.01.0020: report the type code without a country prefix; only an LEI or EUID for a legal person, and only an LEI for a legal person outside the Union.',
    href: 'https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2024_7283',
  },
  {
    name: 'EBA, Explanations of the data quality feedback to the registers of information from the validations',
    date: '10 February 2025',
    what: 'The four validation categories and the order they run in; only the first step has a reject path; EUIDs are fetched from BRIS into a cache before the LEI and EUID checks.',
    href: 'https://www.eba.europa.eu/sites/default/files/2025-02/9613c396-38b6-41fe-86a7-47c2c6461ef2/20250210%20-%20RoI%20validation%20feedback%20explanation.pdf',
  },
  {
    name: 'EBA, Overview of the RoI reporting technical checks and validation rules',
    date: 'updated 28 April 2025',
    what: 'Rule codes VR_2, VR_12, VR_16, VR_23 (B_01 templates), VR_71 and VR_72 (B_05.01.0010), VR_77 and VR_78 (B_05.01.0030); the LEI mask rules v8826_m and v8890_m to v8892_m on the B_01 templates; v8817_m marked deactivated in March 2025.',
    href: 'https://www.eba.europa.eu/sites/default/files/2025-04/10100a51-275f-4c98-96a1-f81342a8f57d/Overview%20of%20the%20RoI%20reporting%20technical%20checks%20and%20validation%20rules%20%28updated%2028%20April%202025%29%20%284%29.xlsx',
  },
  {
    name: 'EBA, Observations from reporting of RoI to the ESAs: key common issues identified',
    date: 'published 16 April 2025, updated 16 May 2025',
    what: 'Which errors reject a file and which do not; the BRIS result counts; the two EUID mistakes the EBA saw most.',
    href: 'https://www.eba.europa.eu/sites/default/files/2025-04/717e7e5f-14ac-45c6-b336-b0aac6a9062a/Observations%20from%20RoI%20reporting%20testing%20-%20common%20issues%20-%20April%202025%20%281%29.pdf',
  },
  {
    name: 'ESAs Decision ESA 2024 22 on reporting of information for CTPP designation',
    date: '8 November 2024, consolidated with corrigendum of 22 January 2025',
    what: 'Annual reporting; reference date 31 December of the preceding year; competent authorities submit by 31 March.',
    href: 'https://www.esma.europa.eu/sites/default/files/2024-11/ESA_2024_22_Decision_on_reporting_of_information_for_CTPP_designation.pdf',
  },
  {
    name: 'Central Bank of Ireland, Reporting registers of information',
    date: 'updated 29 January 2026',
    what: 'The 2026 window, 2 to 31 March 2026, reference date 31 December 2025, the EBA data-quality review in April 2026 with its example of a dummy parent identifier, and the statement that providers need a valid LEI or EU-ID (or another valid code for third-country providers) to pass validation.',
    href: 'https://centralbank.ie/regulation/digital-operational-resilience-act-dora/reporting-registers-of-information',
  },
  {
    name: 'CSSF, DORA register of information collection',
    date: '17 March 2026',
    what: 'Deadline 31 March 2026; ESAs quality control throughout April 2026 with resubmission before the end of April; third-country branches of credit institutions 30 June 2026 on a best-effort basis.',
    href: 'https://www.cssf.lu/en/2026/03/dora-register-of-information-collection/',
  },
  {
    name: 'Commission Implementing Regulation (EU) 2021/1042, Annex',
    date: '18 June 2021',
    what: 'Section 9 of the Annex, what an EUID is made of: country code, register identifier, registration number and an optional verification digit.',
    href: 'https://eur-lex.europa.eu/eli/reg_impl/2021/1042/oj',
  },
  {
    name: 'GLEIF, LEI Common Data File format 3.1: registration status definitions',
    date: 'current specification',
    what: 'The exact meaning of ISSUED, LAPSED, RETIRED, ANNULLED, DUPLICATE, MERGED, PENDING_TRANSFER and PENDING_ARCHIVAL, and of NextRenewalDate.',
    href: 'https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-1-data-lei-cdf-3-1-format',
  },
  {
    name: 'GLEIF blog, The power of transparency: a closer look at LEI renewal rates',
    date: '2 March 2017',
    what: 'GLEIF’s own words on what a lapsed status means.',
    href: 'https://www.gleif.org/en/newsroom/blog/the-power-of-transparency-a-closer-look-at-lei-renewal-rates',
  },
  {
    name: 'GLEIF API and LEI data terms of use',
    date: 'queried 18 October 2026',
    what: 'Live status of any LEI, free, under CC0. The status counts on this page come from this API on that date.',
    href: 'https://www.gleif.org/en/lei-data/gleif-api',
  },
]

const STATUSES: [string, string, string][] = [
  ['ISSUED', 'Validated and issued; the entity was operating as of the last update.', 'What the ITS means by active. Nothing to do.'],
  ['LAPSED', 'Not renewed by the NextRenewalDate, and not known from public sources to have ceased operation.', 'Still the entity’s LEI. Not what the ITS asks for. Ask the provider to renew; see below for how the ESAs treated it.'],
  ['RETIRED', 'The entity has ceased operation without merging into another.', 'Unlikely to be the counterparty on a live contract. Find out who you are actually contracting with.'],
  ['MERGED', 'The entity was merged into another legal entity and no longer exists as an operating entity. GLEIF marks this value deprecated, and the API returned no records with it on 18 October 2026.', 'Report the surviving entity.'],
  ['ANNULLED', 'Marked erroneous or invalid after issue.', 'Do not use it. Look the entity up by name.'],
  ['DUPLICATE', 'A second registration of the same entity; assigned to the one that should no longer be used.', 'Use the surviving LEI.'],
  ['PENDING_TRANSFER / PENDING_ARCHIVAL', 'The registration is being moved to a different LEI issuer (LOU); it reverts to a non-pending status afterwards.', 'The code does not change. Keep it and look again later.'],
]

const FAQ = [
  {
    q: 'Is an EUID accepted instead of an LEI in the DORA register of information?',
    a: 'Yes, for a legal person established in the EU. Article 3(5) of Implementing Regulation (EU) 2024/2956 says financial entities shall use a valid and active LEI or the EUID, and both where available, to identify ICT third-party service providers that are legal persons. The ESAs’ FAQ of 28 March 2025 (Q39) and EBA Q&A 2024_7283 repeat it: for legal persons only an LEI or EUID can be used. Where a provider has both, one goes in B_05.01.0010 and the other in the additional-code field B_05.01.0030; the ESAs asked in October 2024 that the LEI be preferred where both exist. The financial entities themselves, in templates B_01.01 and B_01.02, are identified by LEI only.',
  },
  {
    q: 'What identifier does a non-EU ICT provider need in the DORA register?',
    a: 'An LEI. Recital 9 of the ITS says ICT third-party service providers established in third countries should be identified with LEI only, the ITS fill-in instruction for B_05.01.0020 says "Only LEI shall be used for legal persons that are not established in the Union", and the ESAs’ FAQ (Q39) and EBA Q&A 2024_7283 say the same. The EUID is the identifier of the EU business registers, and the ITS reserves national registration, VAT, passport and identity numbers for individuals acting in a business capacity.',
  },
  {
    q: 'What does LEI status lapsed mean?',
    a: 'GLEIF’s data format defines LAPSED as an LEI registration that has not been renewed by its NextRenewalDate and is not known from public sources to have ceased operation. The code still belongs to that entity and still identifies it; GLEIF has written that an LEI with the status lapsed remains a valid LEI and that the status simply indicates the entity is behind schedule with its annual re-validation. What has lapsed is the yearly check of the reference data, not the identifier.',
  },
  {
    q: 'Will a lapsed LEI get our DORA register rejected?',
    a: 'Not on receipt, by the validations the ESAs have published. The GLEIF checks (VR_71 and VR_77 for provider codes in B_05.01, VR_2, VR_12 and VR_23 for the reporting entities) are business checks that run after the file has been accepted for further validation; the EBA’s April 2025 observations list "Wrong LEI reported" as an error that does not lead to a reject. On status specifically, the ESAs’ FAQ Q44 says the ITS requires the LEI to be active, and that in the initial stages, in particular in 2025, the ESAs would not enforce strict checks of the LEI status. We have not found a later ESAs document that says what applies from 2026, and since 2026 the ESAs also run an April data-quality review that can lead to a request to resubmit. Treat a lapsed code as an obligation you still owe and a finding you may be asked to fix.',
  },
  {
    q: 'What do we report if a third-country provider has no LEI at all?',
    a: 'The identifier is a key, so it cannot be left empty: an empty key fails rule 805 and the whole file is rejected. The ESAs’ FAQ (Q40) says that where no LEI is available for a third-country provider or its ultimate parent, the financial entity should populate the field with any relevant value so the file is not rejected on referential integrity, for example another identifier it has; the ESAs will highlight it as a data-quality issue but the file will not be rejected. Use a real identifier the provider holds, not a placeholder: the Central Bank of Ireland lists "9999999DUMMY99999999" as a parent code as an example of what the April 2026 data-quality review flags. The obligation under Article 3(5) of the ITS to use an LEI remains, so the practical step is to ask the provider to obtain one before the next reference date.',
  },
  {
    q: 'How is the EUID written in the register?',
    a: 'Country code, then the register identifier, then a dot, then the company’s number in that register, with the dot included as part of the code (ESAs FAQ Q45). The structure comes from section 9 of the Annex to Implementing Regulation (EU) 2021/1042, which also allows an optional verification digit. The EBA’s April 2025 observations name two avoidable EUID mistakes, an LEI reported with type EUID and a value that does not follow the EUID pattern, and give the BRIS results: 58,170 values with an invalid EUID format, 2,717 found and 258 not found.',
  },
]

function Src({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--blue-light)] hover:underline">
      {children}
    </a>
  )
}

export default function LeiVsEuidGuide() {
  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'DORA Register Checker', path: '/dora-register' },
          { name: 'LEI or EUID for each ICT provider', path: '/guides/dora-lei-vs-euid-ict-provider-identifier' },
        ]}
      />
      <PageIntro eyebrow="DORA register of information" title="Do we need an LEI or an EUID for each ICT provider in the DORA register?">
        <p>
          A provider that is a legal person needs an LEI or, if it is registered in an EU business register, an
          EUID; both where it has both. A provider outside the EU needs an LEI and nothing else will do. A
          lapsed LEI is still that provider&apos;s LEI, no published check rejects a file for it, and the ESAs said
          they would not enforce status strictly in 2025. What rejects a file on receipt is an empty identifier
          or a parent code that matches no row, not a bad one. Since 2026 there is a second hurdle: the ESAs
          review data quality in April and can send a register back for resubmission, and placeholder codes
          are among the examples given.
        </p>
      </PageIntro>

      <Container className="mt-12 sm:mt-16">
        <FadeIn>
          <p className="max-w-3xl text-sm text-[var(--text-faint)]">
            Every rule below is quoted from the ITS, the ESAs&apos; FAQ, the EBA&apos;s rule list or GLEIF&apos;s own
            definitions, with the document&apos;s date. Checked against those sources on {CHECKED}. Nothing here
            is legal advice; it is what the documents say.
          </p>
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6">
            <p className="text-[var(--text-dim)]">
              The practical step after reading this is to run the register through{' '}
              <Link href="/dora-register" className="font-semibold text-[var(--blue-light)] hover:underline">
                the DORA Register Checker
              </Link>
              . It verifies every LEI&apos;s check digits, looks each one up in GLEIF for existence and status, checks
              EUID structure, and runs the key rules that actually reject files. It runs in your browser and the
              register is not uploaded.
            </p>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">The rule, in the regulation&apos;s own words</h2>
            <div className="mt-6 max-w-3xl space-y-5 leading-7 text-[var(--text-dim)]">
              <p>
                Article 3(5) of{' '}
                <Src href="https://eur-lex.europa.eu/eli/reg_impl/2024/2956/oj">Implementing Regulation (EU) 2024/2956</Src>{' '}
                (adopted 29 November 2024, in force 22 December 2024): financial entities &ldquo;shall use a valid and
                active legal entity identifier (LEI) or the European Unique Identifier referred to in Article 16 of
                Directive (EU) 2017/1132 (&lsquo;EUID&rsquo;), and where available both of these identifiers, to identify
                all of their ICT third-party service providers that are legal persons, except for individuals acting
                in a business capacity.&rdquo;
              </p>
              <p>
                Article 3(6) extends the same requirement to subcontractors that underpin ICT services supporting
                critical or important functions: the financial entity must ensure, through the direct provider, that
                they &ldquo;use a valid and active LEI or provide their EUID, and where available both&rdquo;.
              </p>
              <p>
                Recital 9 makes the geography explicit: either identifier for providers established in the Union,
                &ldquo;whereas the ICT third-party service providers established in third-countries should be identified
                with LEI only&rdquo;. The Annex I fill-in instruction for B_05.01.0020 says it without the hedging:
                &ldquo;Only LEI shall be used for legal persons that are not established in the Union.&rdquo;{' '}
                <Src href="https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2024_7283">EBA Q&amp;A 2024_7283</Src>{' '}
                (final answer 28 March 2025) repeats that sentence almost word for word, and the ESAs&apos;{' '}
                <Src href="https://www.eba.europa.eu/sites/default/files/2025-03/31bb6e60-7d10-4405-a8c5-9f04934630ac/20250328%20-%20DORA%20RoI%20reporting%20FAQ%20%28updated%29.pdf">
                  FAQ of 28 March 2025
                </Src>{' '}
                (Q39) puts it as: for legal persons registered outside the EU &ldquo;only LEI can be used&rdquo;.
              </p>
              <p>
                &ldquo;Where available both&rdquo; has a place in the template. The first code goes in B_05.01.0010
                with its type in 0020; the second goes in the optional additional-code field B_05.01.0030 with its
                type in 0040. The EBA runs the same GLEIF and BRIS checks on that second field (VR_77 and VR_78).
              </p>
              <p>
                The reporting financial entities themselves, in B_01.01 and B_01.02, are identified by LEI only
                (FAQ Q39). The EUID option exists for providers, not for you.
              </p>
            </div>

            <h3 className="mt-12 font-display text-lg font-semibold text-white">Who gets which identifier</h3>
            <table className="mt-4 w-full max-w-3xl border-collapse text-sm">
              <thead>
                <tr className="text-left text-[var(--text-faint)]">
                  <th className="py-2 pr-4 font-medium">Provider</th>
                  <th className="py-2 pr-4 font-medium">Allowed in B_05.01.0020</th>
                  <th className="py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-dim)]">
                {[
                  ['Legal person registered in an EU business register', 'LEI or EUID; both where available (the second in B_05.01.0030)', 'ITS Art. 3(5); FAQ Q39'],
                  ['Legal person established outside the EU', 'LEI only', 'ITS recital 9 and B_05.01.0020 instruction; FAQ Q39; Q&A 2024_7283'],
                  ['Individual acting in a business capacity', 'CRN, VAT, PNR or NIN (or an LEI if they have one)', 'FAQ Q39, Q47'],
                  ['Ultimate parent undertaking (B_05.01.0110)', 'Same rules; the code must match that parent’s own B_05.01.0010 row', 'ITS Annex I, B_05.01.0110 and 0120'],
                  ['The reporting entity and its group (B_01.01, B_01.02)', 'LEI only', 'FAQ Q39'],
                ].map(([who, what, src]) => (
                  <tr key={who} className="border-t border-[var(--line)] align-top">
                    <td className="py-3 pr-4 text-white">{who}</td>
                    <td className="py-3 pr-4">{what}</td>
                    <td className="py-3 text-[var(--text-faint)]">{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 max-w-3xl text-sm text-[var(--text-faint)]">
              The type code is the bare value: LEI, EUID, CRN, VAT, PNR or NIN. The country-code-plus-underscore
              form printed for B_05.01.0020 in the Official Journal text is listed by the ESAs under errors in the
              published ITS; report the value without the country code (FAQ Q47; Q&amp;A 2024_7283).
            </p>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">Why there are two identifiers at all</h2>
            <div className="mt-6 max-w-3xl space-y-5 leading-7 text-[var(--text-dim)]">
              <p>
                The ESAs&apos; draft did not offer an EUID. The European Commission rejected that draft on the grounds
                that it is necessary to &ldquo;allow financial entities the choice of identifying their ICT third-party service
                providers registered in the EU either by using the Legal Entity Identifier (LEI) or by using the
                European Unique Identifier (EUID)&rdquo;. On{' '}
                <Src href="https://www.eiopa.europa.eu/esas-respond-european-commissions-rejection-technical-standards-registers-information-under-dora-and-2024-10-15_en">
                  15 October 2024
                </Src>{' '}
                the ESAs answered that two identifiers &ldquo;could bring additional complexity that would negatively
                impact the quality of data used, and risk delays in the designation of critical ICT third-party service
                providers&rdquo;. They accepted that the EUID is free of charge to EU-registered companies, but said it
                &ldquo;would limit the access to and the possibility for verification of the information by the financial
                entities and competent authorities&rdquo;. If both identifiers had to coexist, the ESAs asked that
                financial entities be given &ldquo;the preference for using LEI, especially where both identifiers are
                available&rdquo;, and that groups keep the codes for their providers consistent.
              </p>
              <p>
                The Commission&apos;s version is the one that became law six weeks later. That history explains the
                shape of the rule: the EUID is an alternative only where it can exist, which is inside the EU
                business registers, and the LEI stays the only option everywhere else.
              </p>
              <p>
                It also explains the verification problem the ESAs predicted. An LEI can be checked against GLEIF
                by anyone, free, by API. An EUID can only be checked in the Business Registers Interconnection
                System, and the FAQ (Q41) says plainly: &ldquo;only manual searches on BRIS are available and there are
                no API for batch processing&rdquo;. The EBA&apos;s own engine works around that by fetching EUIDs from
                BRIS into a cache before it runs the identifier checks (EBA feedback explanation, 10 February 2025).
                A financial entity has no such cache.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">What the two codes are</h2>
            <div className="mt-6 grid gap-10 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">LEI</h3>
                <p className="mt-3 leading-7 text-[var(--text-dim)]">
                  A 20-character alphanumeric code under ISO 17442, which is how the ITS instruction for
                  B_05.01.0010 describes it. The last two characters are check digits, so a typo usually fails
                  arithmetic before it fails a database. The EBA&apos;s LEI format rules (v8826_m, v8890_m to v8892_m)
                  only test the pattern, eighteen letters or digits then two digits, which a transposed code
                  passes; the checksum does not. Those format rules cover the B_01 entity templates; a provider
                  LEI in B_05.01 is tested only against GLEIF (VR_71, VR_77).
                </p>
                <p className="mt-3 leading-7 text-[var(--text-dim)]">
                  Every LEI record carries a registration status and a NextRenewalDate, &ldquo;the next date by which
                  the LEI information must be renewed and re-certified by the Legal Entity&rdquo; (
                  <Src href="https://www.gleif.org/en/lei-data/access-and-use-lei-data/level-1-data-lei-cdf-3-1-format">GLEIF LEI-CDF 3.1</Src>
                  ). The data is published under CC0 and the{' '}
                  <Src href="https://www.gleif.org/en/lei-data/gleif-api">GLEIF API</Src> answers a single
                  record at <code className="font-mono text-xs text-white">api.gleif.org/api/v1/lei-records/&#123;LEI&#125;</code>{' '}
                  with no key.
                </p>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">EUID</h3>
                <p className="mt-3 leading-7 text-[var(--text-dim)]">
                  The European Unique Identifier is the code a company or branch carries in the Business Registers
                  Interconnection System. Section 9 of the Annex to{' '}
                  <Src href="https://eur-lex.europa.eu/eli/reg_impl/2021/1042/oj">Implementing Regulation (EU) 2021/1042</Src>{' '}
                  (18 June 2021) builds it from a country code, a register identifier, the registration number in
                  that register, and an optional verification digit. The ITS instruction for B_05.01.0010 refers to
                  &ldquo;Article 9&rdquo; of that Regulation; the structure is in section 9 of its Annex. The ESAs note
                  it is free of charge to EU-registered companies.
                </p>
                <p className="mt-3 leading-7 text-[var(--text-dim)]">
                  Written out, the country and register part is separated from the company number by a dot, and
                  the ESAs&apos; FAQ (Q45) says the dot is part of the code and must be reported. The EBA&apos;s two
                  &ldquo;easy validations&rdquo; (observations, April 2025): it should contain a dot, and it should start
                  with the two-letter ISO code of an EEA country. You find it by searching the company on the{' '}
                  <Src href="https://e-justice.europa.eu/489/EN/business_registers__search_for_a_company_in_the_eu">
                    e-Justice business registers search
                  </Src>
                  , one company at a time.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">What a lapsed LEI means, from GLEIF rather than from a reseller</h2>
            <div className="mt-6 max-w-3xl space-y-5 leading-7 text-[var(--text-dim)]">
              <p>
                If you have read that a lapsed LEI is &ldquo;no LEI&rdquo; or &ldquo;invalid&rdquo;, that is not GLEIF&apos;s
                definition. GLEIF&apos;s data format defines LAPSED as &ldquo;an LEI registration that has not been renewed
                by the NextRenewalDate and is not known by public sources to have ceased operation&rdquo;. In GLEIF&apos;s
                own words, from its{' '}
                <Src href="https://www.gleif.org/en/newsroom/blog/the-power-of-transparency-a-closer-look-at-lei-renewal-rates">
                  2017 note on renewal rates
                </Src>
                : &ldquo;an LEI with the registration status &lsquo;lapsed&rsquo; remains a valid LEI. The status
                &lsquo;lapsed&rsquo; simply indicates that a legal entity is behind schedule with its renewal, i.e.
                re-validation of its information against third party sources.&rdquo;
              </p>
              <p>
                So two things are true at once. The code still uniquely identifies the provider and will resolve in
                GLEIF. And the ITS asks for a &ldquo;valid and active&rdquo; LEI, which a lapsed one is not, because
                the yearly re-validation of its name, address and parent has not been done.
              </p>
              <p>
                Scale, as of {CHECKED}, from the GLEIF API: 3,465,910 LEI records in total, of which 1,988,277 are
                ISSUED, 1,212,096 are LAPSED, 256,274 RETIRED and 1,732 ANNULLED. Roughly one record in three is
                lapsed, so a register of any size will contain some.
              </p>
              <p>
                The same GLEIF note is also clear about the cost of leaving it: entities behind schedule with their
                renewal &ldquo;risk being sanctioned for non-compliance with the applicable law or losing business,
                because counterparties might refuse to transact with entities that keep their LEI in lapsed
                status&rdquo;. Still the right code, but not a state to leave a provider in.
              </p>
            </div>

            <h3 className="mt-12 font-display text-lg font-semibold text-white">The statuses you will meet, and what to do</h3>
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[var(--text-faint)]">
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">GLEIF definition (LEI-CDF 3.1)</th>
                  <th className="py-2 font-medium">For the register</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-dim)]">
                {STATUSES.map(([s, def, act]) => (
                  <tr key={s} className="border-t border-[var(--line)] align-top">
                    <td className="py-3 pr-4 font-mono text-xs text-white">{s}</td>
                    <td className="py-3 pr-4">{def}</td>
                    <td className="py-3">{act}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">What happens if you get it wrong</h2>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--text-dim)]">
              The ESAs run four categories of checks in sequence: technical checks on the package, DPM technical
              checks, DPM business validation rules, and finally the EUID and LEI checks (EBA feedback
              explanation, 10 February 2025). In that document&apos;s process diagram only the first step has a reject
              path; once a file passes it, the response is &ldquo;pending further validations&rdquo; and the other three
              produce findings in a results file. The EBA&apos;s{' '}
              <Src href="https://www.eba.europa.eu/sites/default/files/2025-04/717e7e5f-14ac-45c6-b336-b0aac6a9062a/Observations%20from%20RoI%20reporting%20testing%20-%20common%20issues%20-%20April%202025%20%281%29.pdf">
                observations from the 2025 collection
              </Src>{' '}
              list, per rule, whether it led to a reject.
            </p>
            <table className="mt-8 w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[var(--text-faint)]">
                  <th className="py-2 pr-4 font-medium">Mistake</th>
                  <th className="py-2 pr-4 font-medium">Rule</th>
                  <th className="py-2 pr-4 font-medium">Rejects the file?</th>
                  <th className="py-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-dim)]">
                {[
                  ['Identifier left empty (it is a key column)', '805', 'Yes', 'EBA rule list 28 Apr 2025; observations Apr 2025; FAQ Q40'],
                  ['Ultimate parent code in B_05.01.0110 that matches no provider row', '807', 'Yes', 'EBA rule list; observations (807 listed first among the most common errors)'],
                  ['Same identifier on two provider rows', '806', 'No in the EBA pipeline, but fix it', 'Rule list (DPM technical check); observations table says no reject, though the same deck’s 806 slide says “rejected”'],
                  ['Type of code not one of the closed-list values', '503', 'No in the EBA pipeline (finding after acceptance)', 'EBA rule list, DPM technical checks; feedback explanation 10 Feb 2025'],
                  ['Entity LEI in B_01.01 to B_01.03 not in the 18+2 pattern', 'v8826_m, v8890_m to v8892_m', 'No (warning)', 'EBA rule list'],
                  ['LEI not found in GLEIF', 'VR_71 (B_05.01.0010), VR_77 (B_05.01.0030), VR_2, VR_12, VR_23 (entities)', 'No (business check)', 'EBA rule list; observations: “Wrong LEI reported”, leads to reject: NO'],
                  ['LEI lapsed in GLEIF', 'none published', 'No; status “not enforced strictly” in 2025', 'FAQ Q44'],
                  ['EUID not found in BRIS, or not in EUID form', 'VR_72 (B_05.01.0010), VR_78 (B_05.01.0030)', 'No (business check)', 'EBA rule list; observations: 58,170 invalid format, 258 not found, 2,717 found'],
                  ['Legal person identified by CRN, VAT or another national code', 'v8817_m', 'No; rule deactivated March 2025', 'EBA rule list; FAQ Q40 says other identifiers are highlighted as a data-quality issue'],
                  ['Country code in B_01.02 not valid according to GLEIF', 'VR_16', 'No (business check)', 'EBA rule list'],
                ].map(([m, r, rej, src]) => (
                  <tr key={m} className="border-t border-[var(--line)] align-top">
                    <td className="py-3 pr-4 text-white">{m}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{r}</td>
                    <td className="py-3 pr-4">{rej}</td>
                    <td className="py-3 text-[var(--text-faint)]">{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-8 max-w-3xl space-y-5 leading-7 text-[var(--text-dim)]">
              <p>
                Two details from the rule list matter in practice. The LEI and EUID checks are marked &ldquo;do not run
                rule&rdquo; when the value is missing, so they never fire on an empty cell; rule 805 has already
                rejected the file by then. And the EBA says it keeps a cache of the GLEIF database; it does not
                publish how often that cache is refreshed, so do not count on a renewal made the day before
                submission showing in the feedback.
              </p>
              <p>
                &ldquo;Does not reject&rdquo; is not &ldquo;does not matter&rdquo;. The FAQ (Q40) says whether the ESAs can use
                an entry with a missing or invalid LEI &ldquo;will depend on the overall quality of the relevant entries&rdquo;,
                and those entries are what the ESAs use to designate critical providers. The Central Bank of Ireland&apos;s{' '}
                <Src href="https://centralbank.ie/regulation/digital-operational-resilience-act-dora/reporting-registers-of-information">guidance for the 2026 round</Src>{' '}
                (page marked updated 29 January 2026) puts it as: providers &ldquo;will need to have either a valid LEI code
                or EU-ID&rdquo; to pass validation, with a footnote allowing &ldquo;other valid code for third country providers
                according to EBA FAQ&rdquo;. A national portal can be stricter than the ESAs&apos; engine, and the EBA&apos;s
                observations say the authorities&apos; own checks &ldquo;may differ&rdquo;.
              </p>
              <p>
                From 2026 there is also a step after acceptance. The same Central Bank of Ireland page says the EBA
                announced, in the week commencing 16 February 2026, an extra review of data content: registers are
                filed in March, then in April the EBA runs data-quality checks on all of them. Its examples include
                &ldquo;An Invalid value reported for the Identification code of a TPP&rsquo;s ultimate parent:
                9999999DUMMY99999999&rdquo;. The{' '}
                <Src href="https://www.cssf.lu/en/2026/03/dora-register-of-information-collection/">CSSF</Src>{' '}
                (17 March 2026) says that if the ESAs detect errors in April &ldquo;and consequently refuse the register
                of information on their side&rdquo;, the entity must fix and resubmit before the end of April. So a bad
                identifier does not bounce the file on receipt, but it can still bring it back to you.
              </p>
              <p>
                On timing: ESAs Decision ESA 2024 22 makes the collection annual, with a reference date of 31 December
                of the preceding year and competent authorities submitting by 31 March. For the 2026 round that meant
                data as at 31 December 2025, a filing window of 2 to 31 March 2026 in Ireland and a 31 March 2026
                deadline in Luxembourg, followed by ESAs quality checks through April 2026 with resubmission before the
                end of April (
                <Src href="https://www.cssf.lu/en/2026/03/dora-register-of-information-collection/">CSSF, 17 March 2026</Src>
                ). The next reference date is 31 December 2026. A lapsed code renewed well before then should show as
                ISSUED when the ESAs check it.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">Fixing the identifiers, step by step</h2>
            <ol className="mt-6 max-w-3xl space-y-5 leading-7 text-[var(--text-dim)]">
              {[
                ['Sort providers into three groups.', 'Legal person inside the EU, legal person outside the EU, individual acting in a business capacity. The third group is the only one that may carry a CRN, VAT, PNR or NIN (FAQ Q39).'],
                ['Look every LEI up in GLEIF, not in your vendor master.', 'Check the check digits first; then existence, then registration status and NextRenewalDate, then the legal name and legal-address country against what the register says. The legal name to report is the one in the business register (FAQ Q120); where GLEIF shows something different, find out which is current.'],
                ['Lapsed: ask the provider to renew; keep the code.', 'Renewal is the registrant’s act, not yours, and the code does not change. Record the request and the NextRenewalDate. Do not swap the LEI for an EUID or a national number to make the warning go away; an EU provider may carry both, and a third-country provider may carry only the LEI.'],
                ['Retired, merged, annulled, duplicate: find the real counterparty.', 'A retired code means the entity has ceased operation. The contract is with someone, and that someone has an identifier; report that one and put the former entity nowhere.'],
                ['No LEI, provider in the EU: find the EUID.', 'Search the company on the e-Justice portal, one at a time. Report it as country code, register identifier, dot, registration number, with the dot (FAQ Q45), and type EUID. Do not report an LEI under type EUID; that was the EBA’s most common EUID error.'],
                ['No LEI, provider outside the EU: fill the key and flag it.', 'Leaving the cell empty rejects the file (805). The FAQ (Q40) says to populate it with any relevant value, in practice another identifier you hold, and accept the data-quality finding. Use a real code, not a placeholder: a dummy parent code is one of the examples the April 2026 data-quality review flags. Then get the provider an LEI before the next reference date; the ITS obligation to use one does not lapse because the ESAs did not enforce it.'],
                ['Make the parent rows close.', 'Every code in B_05.01.0110 must appear as a B_05.01.0010 row for that parent, with the same type in 0120 as that row’s 0020. A provider with no group repeats its own code (ITS Annex I). This is rule 807, listed first among the most common errors in the EBA’s 2025 observations.'],
                ['Run the checker, then the GLEIF step.', 'The first pass runs the package and key rules that reject, plus the closed-list and mandatory-field checks that come back as findings. The optional second pass sends the LEIs, and nothing else, to GLEIF and returns status, name and parent for each. EUIDs are checked for structure only, because BRIS cannot be queried.'],
              ].map(([h, body], i) => (
                <li key={h} className="rule-fade pt-4">
                  <p className="font-display font-semibold text-white">
                    <span className="mr-3 font-mono text-xs text-[var(--text-faint)]">{String(i + 1).padStart(2, '0')}</span>
                    {h}
                  </p>
                  <p className="mt-1">{body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10">
              <Link href="/dora-register" className="inline-flex items-center rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)]">
                Open the DORA Register Checker
              </Link>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">A worked example: five providers, five outcomes</h2>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--text-dim)]">
              A fictional bank&apos;s B_05.01 has five providers. The identifiers below are shaped like real ones but
              only the GLEIF row is a real record; the rest are patterns, not codes to copy.
            </p>
            <table className="mt-8 w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[var(--text-faint)]">
                  <th className="py-2 pr-4 font-medium">Provider</th>
                  <th className="py-2 pr-4 font-medium">What the register says</th>
                  <th className="py-2 pr-4 font-medium">What the checks say</th>
                  <th className="py-2 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-dim)]">
                {[
                  ['A Swiss foundation (GLEIF itself, as the one real row)', 'LEI 506700GE1G29325QX363, type LEI', `Check digits pass. GLEIF, ${CHECKED}: Global Legal Entity Identifier Foundation, ISSUED, next renewal 15 March 2027, country CH.`, 'Accepted; nothing to do.'],
                  ['A Dutch software company', 'Type EUID, value NL + register identifier + dot + company number', 'Starts with an EEA country code and contains a dot: passes the two easy checks the EBA suggests. Existence in BRIS can only be checked by hand on the e-Justice portal.', 'Accepted; VR_72 may still warn if BRIS does not know the number.'],
                  ['A US cloud provider', 'Type LEI, value with status LAPSED since last spring', 'Check digits pass; GLEIF resolves it to the right name; status is not ISSUED.', 'Not a reject: no published rule tests status, and FAQ Q44 said status would not be strictly enforced in 2025. Renewal requested from the provider; not a reason to change the code.'],
                  ['An Indian outsourcing firm with no LEI', 'Type CRN, value a national registration number', 'A legal person outside the EU with a non-LEI code. v8817_m would have flagged it but is deactivated; the ITS still requires an LEI.', 'Accepted with a data-quality finding (FAQ Q40), and open to a resubmission request in the April review. Get the firm an LEI before 31 December 2026.'],
                  ['The US provider’s parent', 'B_05.01.0110 holds the parent LEI, but there is no B_05.01 row for the parent', 'Foreign key from 0110 to 0010 fails.', 'Rule 807: the whole file is rejected. Add a B_05.01 row for the parent under the same code and type.'],
                ].map(([p, reg, chk, out]) => (
                  <tr key={p} className="border-t border-[var(--line)] align-top">
                    <td className="py-3 pr-4 text-white">{p}</td>
                    <td className="py-3 pr-4">{reg}</td>
                    <td className="py-3 pr-4">{chk}</td>
                    <td className="py-3">{out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-6 max-w-3xl leading-7 text-[var(--text-dim)]">
              Four of the five rows get through on receipt. The one that fails the file has nothing to do with LEI versus
              EUID: it is a parent code with no row behind it. That is the pattern in the EBA&apos;s 2025 observations,
              where foreign-key violations (807) are listed first among the most common errors and lead to a reject,
              and wrong LEIs are marked as not leading to one. Rows three and four can still come back in the April
              data-quality review.
            </p>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">Sources, with dates</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              Each fact above comes from one of these. If a document here is superseded, the page is out of date;
              the ESAs&apos; FAQ in particular has not been reissued since 28 March 2025 as of {CHECKED}.
            </p>
            <ul className="mt-10 space-y-6">
              {SOURCES.map((s) => (
                <li key={s.name} className="rule-fade pt-4">
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-display font-semibold text-white hover:text-[var(--blue-light)]">
                    {s.name}
                  </a>
                  <p className="mt-1 text-xs text-[var(--text-faint)]">{s.date}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-dim)]">{s.what}</p>
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
