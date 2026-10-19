import Link from 'next/link'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { DatasetStructuredData } from '@/components/StructuredData'
import { CiteThis } from '@/components/really-european/CiteThis'
import {
  CSV_PATH,
  DATASET_NAME,
  DIRECTORY_ROWS,
  FEATURED,
  FEATURED_SLUGS,
  GLEIF_VIEW_LABEL,
  JSON_PATH,
  META,
  PATH,
  ROWS,
  VERDICTS,
  VERDICT_LABEL,
  VERDICT_LINE,
  apaCitation,
  bibtexCitation,
  directoryStats,
  doraStats,
  facet,
  gleifView,
  ownerRegion,
  pct,
  shortName,
} from '@/lib/really-european'
import { CONTACT_EMAIL, pageMetadata } from '@/lib/site'
import { AuditTable, type TableRow } from './AuditTable'

const S = directoryStats()
const D = doraStats()

export const metadata = pageMetadata({
  title: 'Really European? Who owns the buy-European tech',
  ogTitle: `Really European? The LEI register names a parent for ${S.parentNamed} of ${S.total} buy-European products`,
  description: `We traced ${S.total} products from Europe’s five buy-European directories to company registers and filings. ${S.nonEu} are controlled from outside the EU; the LEI register can name the owner of ${S.hiddenGleifNamesParent} of the ${S.hidden} we flagged. Verdicts, owners and sources, free to download (CC0).`,
  path: PATH,
  keywords: [
    'is it european',
    'european alternatives ownership',
    'buy european',
    'who owns',
    'european owned companies',
    'non-EU owned',
    'LEI parent company',
    'european tech ownership dataset',
  ],
})

const TABLE: TableRow[] = ROWS.map((r) => ({
  slug: r.slug,
  product: r.product,
  legal_entity: r.legal_entity,
  country: r.country,
  category: r.category,
  verdict: r.verdict,
  owner: r.owner,
  owner_country: r.owner_country,
  region: ownerRegion(r),
  gleif: gleifView(r),
  gleifLabel: GLEIF_VIEW_LABEL[gleifView(r)],
  source_url: r.source_url,
  checked_on: r.checked_on,
  list: r.list,
  listed_on: r.listed_on.length,
  page: FEATURED_SLUGS.has(r.slug),
}))

const VERDICT_COUNTS = VERDICTS.map((v) => [v, DIRECTORY_ROWS.filter((r) => r.verdict === v).length] as const)

/** How control was established on the verified directory rows, counted from
 *  the control_type field. Labels only; the counts come from the data. */
const CONTROL_TYPES = facet(
  DIRECTORY_ROWS.filter((r) => r.verdict !== 'unverified'),
  (r) => r.control_type,
)
const CONTROL_TYPE_LABEL: Record<string, string> = {
  'majority-registry': 'Majority holder named in a company register',
  'largest-shareholder-filing': 'Largest holder named in a filing or annual report',
  'founder-held': 'Founders in control, from a register or filing',
  'listed-dispersed': 'Listed, no holder in control',
  'pe-backed-announcement': 'Acquisition announced by a party to the deal',
  'state-owned': 'State owner, from the owner’s annual report',
}

const FAQ = [
  {
    q: 'How do you decide whether a company is really European?',
    a: `We follow the legal entity behind each product to the owner a primary document names: a company register entry, an annual report, a regulatory filing, or an acquisition announcement by a party to the deal. Only then do we say EU-controlled, non-EU-controlled or PE-controlled. Of the ${S.total} directory products we checked on ${META.checked_on}, ${S.unverified} had no free document that settles it, and we publish those as unverified rather than guess.`,
  },
  {
    q: 'Do the buy-European directories check ownership?',
    a: `None of the five we checked (${META.directories.join(', ')}) publishes an ownership check. Their criteria are headquarters, self-declaration or none at all. That is why a product can appear on all five and still have a controlling owner outside the EU.`,
  },
  {
    q: 'Can GLEIF tell me who owns a company?',
    a: `Only if the company holds an LEI and reports a parent. Of the ${S.total} directory products, ${S.noLei} have no LEI at all and ${S.exception} report an exception instead of a parent. Of the ${S.hidden} where we verified non-EU or private-equity control from documents, GLEIF names a parent for ${S.hiddenGleifNamesParent}.`,
  },
  {
    q: 'Is a Swiss or UK owner counted as non-EU?',
    a: `Yes, and the table says so. ${S.nonEuInEurope} of the ${S.nonEu} non-EU-controlled directory products have an owner in Europe outside the EU, such as Switzerland, the UK or Norway; ${S.nonEuOutsideEurope} have an owner outside Europe. Read the owner country before quoting a row.`,
  },
  {
    q: 'Can I use the data?',
    a: `Yes. The CSV and JSON are public domain (CC0 1.0): no permission or attribution needed, though a link back helps others find corrections. Each row carries its source URL and the date we checked it.`,
  },
]

export default function ReallyEuropean() {
  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Really European?', path: PATH },
        ]}
      />
      <DatasetStructuredData
        dataset={{
          name: DATASET_NAME,
          description: `Ownership of ${S.total} products listed on Europe’s five buy-European directories and ${D.total} ICT providers to EU financial entities: legal entity, LEI and GLEIF-reported parent, the controlling owner a primary document names, verdict, source URL and date checked. Rows without a free primary document are published as unverified.`,
          path: PATH,
          modified: META.version,
          license: META.license_url,
          creatorName: META.publisher,
          keywords: [
            'company ownership',
            'european companies',
            'buy european',
            'legal entity identifier',
            'LEI',
            'GLEIF',
            'DORA',
            'ultimate parent',
            'digital sovereignty',
          ],
          measurementTechnique:
            'Product to legal entity via the vendor imprint; LEI and parent from the GLEIF API; controlling owner from company registers, annual reports, regulatory filings and acquisition announcements by a party to the deal',
          files: [
            { name: 'really-european.csv', description: 'One row per product or provider, CC0', url: CSV_PATH },
            {
              name: 'really-european.json',
              description: 'The same rows with metadata and changelog, CC0',
              url: JSON_PATH,
              format: 'application/json',
            },
          ],
        }}
      />

      <PageIntro eyebrow="Ownership audit" title="Really European?">
        {/* The claim, what we did, the turn. Every number is an S.* value. */}
        <p>
          Europe is being told to buy European, and five directories say what qualifies; none of them
          checks who owns it. We traced {S.total} of their products to the company that controls them
          through registers and filings, and found that the EU&rsquo;s own identifier system, the LEI
          register its supervisors use to group providers, can name a parent for {S.parentNamed} of
          the {S.total}.
        </p>
      </PageIntro>

      {/* ------------------------------------------------------- headline --- */}
      <div className="section-lift mt-6 py-16 sm:py-20">
        <Container>
          <FadeIn>
            <dl className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-sm text-[var(--text-dim)]">Directory products checked</dt>
                <dd className="stat mt-2 font-display text-5xl font-semibold">{S.total}</dd>
                <p className="mt-2 text-sm text-[var(--text-faint)]">
                  {S.verified} verified from documents, {S.unverified} unverified
                </p>
              </div>
              <div>
                <dt className="text-sm text-[var(--text-dim)]">Verified non-EU-controlled</dt>
                <dd className="stat mt-2 font-display text-5xl font-semibold">{S.nonEu}</dd>
                <p className="mt-2 text-sm text-[var(--text-faint)]">
                  {S.nonEuOutsideEurope} owned from outside Europe, {S.nonEuInEurope} from Europe outside
                  the EU
                </p>
              </div>
              <div>
                <dt className="text-sm text-[var(--text-dim)]">Verified private-equity control</dt>
                <dd className="stat mt-2 font-display text-5xl font-semibold">{S.pe}</dd>
                <p className="mt-2 text-sm text-[var(--text-faint)]">
                  {pct(S.nonEu + S.pe, S.verified)}% of verified products are controlled from outside the
                  EU or by private equity
                </p>
              </div>
              <div>
                <dt className="text-sm text-[var(--text-dim)]">Of those, GLEIF names a parent for</dt>
                <dd className="stat mt-2 font-display text-5xl font-semibold">
                  {S.hiddenGleifNamesParent}
                  <span className="text-2xl text-[var(--text-dim)]"> / {S.hidden}</span>
                </dd>
                <p className="mt-2 text-sm text-[var(--text-faint)]">
                  {S.noLei} of {S.total} products have no LEI; {S.exception} report an exception instead of a
                  parent
                </p>
              </div>
            </dl>
            {/* The press-note paragraph. Every number is an S.* or D.* value. */}
            <p className="mt-12 max-w-3xl text-[var(--text-dim)]">
              EU supervisors group ICT providers by the parent links in the global LEI register when they
              measure concentration. Of the {S.hidden} buy-European products where documents show control
              from outside the EU or by private equity, that register names a parent for{' '}
              {S.hiddenGleifNamesParent}. Of the {D.nonEu} ICT providers to EU financial entities where
              documents show control from outside the EU, it names a parent for {D.nonEuGleifNamesParent}.
              The same method sees the global providers clearly and Europe&rsquo;s own vendors hardly at
              all: {S.noLei} of the {S.total} products have no LEI, {S.exception} hold one and report an
              exception in place of a parent, and {S.lapsed} of the LEIs that do exist have lapsed.
            </p>
          </FadeIn>
        </Container>
      </div>

      {/* ---------------------------------------------------------- table --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade pt-10">
            <h2 className="font-display text-2xl font-medium text-white">Every row, with its source</h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              Filter by country, category or verdict, sort any column, and open the source before you
              quote a row: a verdict is only as strong as the document beside it, and the {S.unverified}{' '}
              rows with no document we could accept say unverified rather than guess. Switch the list to
              see the ICT providers EU financial entities report under DORA.
            </p>
            <div className="mt-10">
              <AuditTable rows={TABLE} verdictLabels={VERDICT_LABEL} />
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/really-european/check">Check a product</Button>
              <Link
                href={CSV_PATH}
                className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
              >
                Download the CSV
              </Link>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* --------------------------------------------------------- method --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade grid gap-12 pt-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-medium text-white">What the verdicts mean</h2>
              <dl className="mt-8 space-y-6">
                {VERDICT_COUNTS.map(([v, n]) => (
                  <div key={v} className="rule-fade pt-4">
                    <dt className="flex items-baseline justify-between gap-4">
                      <span className="font-display font-semibold text-white">{VERDICT_LABEL[v]}</span>
                      <span className="stat font-display text-xl">{n}</span>
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-[var(--text-dim)]">{VERDICT_LINE[v]}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium text-white">How we checked</h2>
              <ol className="mt-8 list-decimal space-y-4 pl-5 text-[var(--text-dim)]">
                <li>
                  Took the products listed on {META.directories.join(', ')}, kept the {S.total} most listed
                  and most searched for ({S.onAllFive} appear on all five), and copied nothing beyond names
                  and links.
                </li>
                <li>
                  Read each product&rsquo;s imprint or terms to find the legal entity you actually contract
                  with, which is often not the brand&rsquo;s own company.
                </li>
                <li>
                  Looked that entity up in the GLEIF API, one request at a time: LEI or none, status, next
                  renewal, and the parent it reports or the exception it claims instead.
                </li>
                <li>
                  Traced the controlling owner in free primary documents only, and gave a verdict only where
                  one names it. {META.evidence_rule}
                </li>
              </ol>
              <p className="mt-6 text-sm text-[var(--text-faint)]">
                No paid register extracts, no paid APIs, no guesses. Rows checked {META.checked_on}.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ---------------------------------------------------- methodology --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade pt-10">
            <h2 className="font-display text-2xl font-medium text-white">Method</h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              What a verdict means, which documents earn one, what unverified means and how to correct a
              row. Nothing here is stronger than the evidence rule above.
            </p>
            <div className="mt-10 grid gap-12 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">What counts as control</h3>
                <p className="mt-3 text-[var(--text-dim)]">
                  The controlling owner is the party a primary document shows holding a majority of the
                  votes or the capital. Where nobody does, we take the largest holder a filing names and say
                  so in the row; where the company is listed with no holder in control, the verdict follows
                  the country of the company itself. A founder in control is a verdict on where the founder
                  sits, and a private-equity fund in control is its own verdict, whatever the fund&rsquo;s
                  country. Non-EU means outside the European Union: Switzerland, the UK, Norway and Jersey
                  are non-EU here, and the owner-country column says which it is.
                </p>
                <dl className="mt-6 space-y-2 text-sm">
                  {CONTROL_TYPES.map(([t, n]) => (
                    <div key={t} className="flex items-baseline justify-between gap-4 rule-fade pt-2">
                      <dt className="text-[var(--text-dim)]">{CONTROL_TYPE_LABEL[t] ?? t}</dt>
                      <dd className="stat font-display text-white">{n}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Sources that earn a verdict</h3>
                <p className="mt-3 text-[var(--text-dim)]">
                  Four kinds of document, each linked in the row with the date we read it: a company
                  register entry (a persons-with-significant-control filing, a shareholder list, a
                  beneficial-owner card), an annual report or registration document, a regulatory filing
                  such as a 20-F, a 10-K subsidiary list or a voting-rights notification, or an acquisition
                  announcement published by a party to the deal. Press coverage, encyclopaedias, funding
                  databases, the directories&rsquo; own listings and the parent GLEIF reports do not earn a
                  verdict; the GLEIF parent is shown beside the verified owner, never in place of it.
                </p>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">What unverified means</h3>
                <p className="mt-3 text-[var(--text-dim)]">
                  {S.unverified} of the {S.total} products are unverified. It means we found no free
                  primary document that settles control, not that something is hidden: most are private
                  companies whose shareholder list sits behind a paid extract or an interactive portal with
                  no stable link, and we bought nothing. An unverified row shows no owner on this site; the
                  CSV keeps our notes on what we found and what is missing, with the verdict column still
                  saying unverified. Quoting an unverified row as a finding is a misreading of the data.
                </p>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Corrections</h3>
                <p className="mt-3 text-[var(--text-dim)]">
                  Send the document, not the claim: a register extract, filing or annual report with a
                  date, to the Analytics Ascent research desk at{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                  . We re-read it, change the row, bump the dataset version and log the change in the
                  changelog below, and every badge that points at the row updates with it. A correction
                  that removes a verdict is logged the same way as one that adds it.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------- most searched --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade pt-10">
            <h2 className="font-display text-2xl font-medium text-white">The names people ask about</h2>
            <ul className="mt-8 flex flex-wrap gap-3">
              {FEATURED.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/really-european/${r.slug}`}
                    className="inline-block rounded-full border border-[var(--line-bright)] px-3 py-1 text-sm text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
                  >
                    Is {shortName(r)} European?
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------ download, cite, badge --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade pt-10">
            <h2 className="font-display text-2xl font-medium text-white">Take it, cite it, embed it</h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              The data is public domain (CC0 1.0). Download{' '}
              <a href={CSV_PATH} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                really-european.csv
              </a>{' '}
              or{' '}
              <a href={JSON_PATH} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                really-european.json
              </a>
              . Directories and vendors can embed a{' '}
              <Link href="/really-european/badge" className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                dated ownership badge
              </Link>{' '}
              that links back to the evidence.
            </p>
            <div className="mt-10">
              <CiteThis apa={apaCitation()} bibtex={bibtexCitation()} />
            </div>

            <h3 className="mt-12 font-display text-lg font-semibold text-white">Changelog</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-dim)]">
              {META.changelog.map((c) => (
                <li key={c.date + c.entry}>
                  <span className="text-white tabular-nums">{c.date}</span> {c.entry}
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </Container>

      {/* --------------------------------------------------------- press --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] px-6 py-12 sm:px-12">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-2xl font-medium text-white">For journalists and corrections</h2>
                <p className="mt-4 text-[var(--text-dim)]">
                  Quote any number or row freely: the data is public domain and every figure on this page
                  is computed from the published rows, so what you quote is what the file says. For a
                  row&rsquo;s underlying documents, a country or category cut, or a correction with the
                  document that shows it, write to the research desk; corrections are made in the row and
                  logged with the date.
                </p>
                <p className="mt-4 text-sm text-[var(--text-dim)]">
                  <span className="text-white">Analytics Ascent research desk</span>
                  <br />
                  <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium text-white">Filing a DORA register?</h2>
                <p className="mt-4 text-[var(--text-dim)]">
                  The same rows, cut for B_05.01: {D.total} ICT providers with the entity as filed, LEI status
                  and renewal, GLEIF parent against verified owner, and CTPP roll-up.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <Button href="/dora/providers">ICT providers for DORA</Button>
                  <Link
                    href="/datasets/who-owns-what"
                    className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
                  >
                    The method behind it
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade pt-10">
            <Faq items={FAQ} />
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
