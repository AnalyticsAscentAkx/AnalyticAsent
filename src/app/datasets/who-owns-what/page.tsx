import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { RootLayout } from '@/components/RootLayout'
import { DatasetStructuredData } from '@/components/StructuredData'
import { CompareBars, Histogram } from '@/components/Charts'
import { Resolver } from './Resolver'
import resolver from '../../../../public/datasets/who-owns-what/resolver.json'

export const metadata: Metadata = {
  title: 'Who owns what',
  description:
    'A free company ownership database from public registers: parent company lookup, entity resolution and research funding joined on. Download the CSVs.',
  alternates: { canonical: '/datasets/who-owns-what' },
  openGraph: {
    title: 'Who owns what — company ownership, joined from public registers',
    description: 'A free company ownership database from public registers: parent company lookup, entity resolution and research funding joined on. Download the CSVs.',
    url: '/datasets/who-owns-what',
    images: ['/opengraph-image'],
  },
  keywords: [
    'company ownership database',
    'parent company lookup',
    'corporate structure data',
    'free company dataset',
    'entity resolution',
    'record linkage',
    'legal entity identifier',
    'LEI data',
  ],
}

// What a different sector adds on top. The point is not that these are built —
// they are not, and the page says so — but that the shape of the problem does
// not change. Only the registers you reach for do.
const SECTORS: [string, string][] = [
  [
    'Pharmaceuticals',
    'Marketing authorisations, clinical trial registries and orphan designations, keyed to the same corporate groups.',
  ],
  [
    'Aerospace and defence',
    'Design and production approvals, airworthiness certificates, and the supplier chains visible through public tenders.',
  ],
  [
    'Construction and materials',
    'Environmental declarations from programme operators, CE marking and declarations of performance.',
  ],
  [
    'Energy and utilities',
    'Generation licences, grid connection registers and subsidy allocations by operator.',
  ],
  [
    'Logistics and shipping',
    'Vessel and fleet registers, operating licences, and beneficial ownership where it is disclosed.',
  ],
  [
    'Any sector at all',
    'Company registers, VAT and LEI data, public tenders and grant funding exist for every industry in Europe. None of them share a key.',
  ],
]

const FAQ = [
  { q: 'What is entity resolution?', a: 'Entity resolution is deciding which records across different sources refer to the same real-world thing — the same company, customer or part — when they share no identifier and are spelled differently in each. It is the step that makes a join possible at all.' },
  { q: "How do you find a company's parent company?", a: 'Where an entity holds a Legal Entity Identifier it may have reported its direct and ultimate parent to the LEI register, and that filing is authoritative because the company made it. Where no LEI or no filing exists, the relationship has to be inferred from names or corporate filings, which is a guess and should be labelled as one.' },
  { q: 'Is there a free company ownership database?', a: 'The underlying registers are free: the global LEI register publishes legal names, jurisdictions and reported parent relationships under an open licence, and EU research funding is published as open data. What does not exist for free is the joined version, because the registers share no common key.' },
  { q: 'Why is matching company names so difficult?', a: 'Legal forms differ by jurisdiction without changing the company, brands and registered names rarely agree, groups file under several parents, and short names are ordinary words. Matching on names alone will put a company in India called MARS INDUSTRIES into the same group as a confectioner unless something stops it.' },
]

// Figures below are computed from the published resolver output rather than
// typed in, so a regenerated dataset cannot leave a stale chart behind.
const GROUPS = [...resolver.groups].sort((a, b) => b.legal_entities - a.legal_entities)

const TOP_GROUPS = GROUPS.slice(0, 10).map((g) => ({
  label: g.group,
  value: g.legal_entities,
  display: `${g.legal_entities.toLocaleString('en-GB')} in ${g.countries} countries`,
}))

const MEDIAN_ENTITIES = GROUPS[Math.floor(GROUPS.length / 2)].legal_entities

const BANDS: [string, number, number][] = [
  ['1–9', 1, 9],
  ['10–24', 10, 24],
  ['25–49', 25, 49],
  ['50–99', 50, 99],
  ['100–199', 100, 199],
  ['200+', 200, Infinity],
]

const SIZE_BINS = BANDS.map(([label, lo, hi]) => ({
  label,
  count: GROUPS.filter((g) => g.legal_entities >= lo && g.legal_entities <= hi).length,
}))

const SMALL_SHARE = Math.round(
  (GROUPS.filter((g) => g.legal_entities < 25).length / GROUPS.length) * 100,
)

export default function WhoOwnsWhat() {
  return (
    <RootLayout>
      <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Who owns what', path: '/datasets/who-owns-what' }]} />
      <DatasetStructuredData
        dataset={{
          name: 'Who owns what: corporate structure from public registers',
          description:
            'Legal entities resolved into corporate groups from the LEI register, rolled up to the ultimate parents those entities report, and joined to EU research funding. Food technology is the worked example. Published with its error cases and a measured precision and recall.',
          path: '/datasets/who-owns-what',
          modified: resolver.generated,
          keywords: [
            'entity resolution',
            'corporate structure',
            'beneficial ownership',
            'legal entity identifier',
            'LEI',
            'record linkage',
            'open data',
            'research funding',
            'food technology',
          ],
          measurementTechnique:
            'Name clustering scored pairwise against self-reported ultimate parents in the LEI register',
          files: [
            { name: 'entities.csv', description: 'One row per legal entity, with how it was grouped and why' },
            { name: 'groups.csv', description: 'One row per corporate group: hierarchy, countries, research funding' },
            { name: 'uncertain.csv', description: 'Every row the method could not place confidently' },
          ],
        }}
      />
      <PageIntro eyebrow="Dataset" title="Who owns what">
        <p>
          The data is public. It is scattered across registers that do not share an identifier, so
          nobody has joined it, and joining it is the work. This is that work done on food
          technology — the sector is the worked example, not the subject.
        </p>
      </PageIntro>

      <Container className="mt-14">
        <FadeIn>
          <Resolver />
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------- figures --- */}
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">
              What the resolved data looks like
            </h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              Both figures are drawn from the published file rather than redrawn by hand, so they
              move when the data does.
            </p>

            <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <div>
                <h3 className="font-display font-semibold text-white">
                  Ownership is extremely top-heavy
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                  The largest group holds {TOP_GROUPS[0].value.toLocaleString('en-GB')} legal
                  entities; the median group holds {MEDIAN_ENTITIES}. Any analysis that treats a
                  &ldquo;company&rdquo; as one row is counting the tail and missing the head.
                </p>
                <CompareBars
                  points={TOP_GROUPS}
                  caption="Legal entities per corporate group, ten largest groups"
                />
              </div>

              <div>
                <h3 className="font-display font-semibold text-white">
                  Most groups are small; a few are enormous
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                  {SMALL_SHARE}% of the {GROUPS.length} groups hold fewer than 25 entities. The
                  distribution is the reason a name-matching threshold tuned on the average group
                  fails badly at both ends.
                </p>
                <Histogram
                  bins={SIZE_BINS}
                  xLabel="legal entities per group"
                  caption="How many groups fall in each size band"
                />
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------- sector agnostic --- */}
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Food technology is one input, not the method
            </h2>
            <p className="mt-5 max-w-3xl text-[var(--text-dim)]">
              Worth being precise about, because &ldquo;it works for any sector&rdquo; is the kind
              of claim everyone makes. Here it is an architectural fact rather than a promise:{' '}
              <span className="text-white">
                exactly one file in the pipeline knows what food technology is
              </span>{' '}
              — a list of company names, written the way a person would type them. The registers it
              queries, the rules that cluster names into groups, the rollup to reported parents,
              the scoring and the published error cases are all untouched by the sector.
            </p>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              Which is also why this sector was chosen: large groups sitting behind subsidiary
              tangles, so the resolution has visible work to do. A sector with simpler ownership
              would have produced a prettier number and proved less.
            </p>

            <h3 className="mt-12 font-display text-lg font-semibold text-white">
              What changes when you point it somewhere else
            </h3>
            <p className="mt-3 max-w-3xl text-sm text-[var(--text-dim)]">
              Only the registers stacked on top. These are not built — none of them is a different
              kind of problem, which is rather the point.
            </p>
            <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {SECTORS.map(([name, detail]) => (
                <div key={name} className="border-t border-[var(--line)] pt-4">
                  <dt className="font-display font-semibold text-white">{name}</dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeIn>
      </Container>

      {/* -------------------------------------------------------- download --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">
              Take the dataset and check it
            </h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              No sign-up. The third file is the one worth opening first: every row the method could
              not place, or placed on weak evidence. A dataset that publishes only its successes is
              asking to be trusted rather than checked.
            </p>
            <ul className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-3">
              {[
                ['entities.csv', 'One row per legal entity, with how it was grouped and why'],
                ['groups.csv', 'One row per group: hierarchy, countries, research funding'],
                ['uncertain.csv', 'Everything the method could not place confidently'],
              ].map(([file, what]) => (
                <li key={file} className="border-t border-[var(--line)] pt-4">
                  <a
                    href={`/datasets/who-owns-what/downloads/${file}`}
                    download
                    className="font-medium text-[var(--blue-light)] underline-offset-4 hover:underline"
                  >
                    {file}
                  </a>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{what}</p>
                </li>
              ))}
            </ul>
          </div>
        </FadeIn>
      </Container>

      {/* ---------------------------------------------------------- limits --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">
              What this does not tell you
            </h2>
            <div className="mt-6 grid gap-x-12 gap-y-6 text-[var(--text-dim)] lg:grid-cols-2">
              <p>
                <span className="text-white">Coverage is not completeness.</span> An entity without
                an LEI is invisible here, and plenty of subsidiaries have no reason to hold one. A
                group showing four entities may well have forty.
              </p>
              <p>
                <span className="text-white">Reported parents are self-reported.</span> They are
                the company&apos;s own filing, which makes them authoritative about intent and
                occasionally out of date about fact.
              </p>
              <p>
                <span className="text-white">The funding join is a name match.</span> The grant
                data carries no company identifier. The join is deliberately conservative, so it
                misses grants before it invents them — under-counting, not over-counting.
              </p>
              <p>
                <span className="text-white">No patent or IP layer.</span> Every patent register
                worth using needs an API key and carries its own licence terms for derived
                datasets. Scoped, not built.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------------- CTA --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] px-6 py-16 sm:px-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Your sources, merged the same way
              </h2>
              <p className="mt-5 text-[var(--text-dim)]">
                This took public registers that share no identifier and produced something
                checkable. The same problem usually turns up inside a company first: a CRM, an ERP
                and a billing system that each believe a customer is called something different.
                The useful version resolves your sources, in your sector, and hands back a pipeline
                you own.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="/contact?subject=Entity%20resolution">Talk about your sources</Button>
                <Link
                  href="/data-clinic"
                  className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
                >
                  Or test your file first
                </Link>
              </div>
            </div>
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
