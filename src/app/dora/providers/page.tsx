import Link from 'next/link'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { VerdictPill } from '@/components/really-european/VerdictPill'
import {
  CSV_PATH,
  DORA_ROWS,
  META,
  ctppLine,
  doraStats,
  isCandidateLei,
  lapsedTwins,
  leiCode,
  type Row,
} from '@/lib/really-european'
import { pageMetadata } from '@/lib/site'

// The buyer's cut of the Really European? rows: the contracting entities EU
// registers of information keep repeating, with the fields B_05.01 asks for.
// Same file, same evidence rule; the cards only rearrange it.

const D = doraStats()

export const metadata = pageMetadata({
  title: 'ICT provider LEIs for the DORA register (B_05.01)',
  ogTitle: 'DORA ICT providers: entity, LEI, parent and CTPP roll-up',
  description: `${D.total} ICT providers EU financial entities report: entity as filed, LEI or EUID, GLEIF status and renewal, GLEIF parent against verified owner, lapsed twins, CTPP roll-up.`,
  path: '/dora/providers',
  keywords: [
    'DORA ICT third-party provider LEI',
    'B_05.01',
    'register of information provider identifier',
    'amazon web services emea sarl lei',
    'microsoft ireland operations limited lei',
    'CTPP list',
    'LEI or EUID DORA',
    'ultimate parent DORA register',
  ],
})

const SORTED = [...DORA_ROWS].sort(
  (a, b) => Number(!ctppLine(a)) - Number(!ctppLine(b)) || a.product.localeCompare(b.product),
)

const FAQ = [
  {
    q: 'Which identifier goes in B_05.01 for an ICT provider?',
    a: 'The LEI of the legal entity you contract with, or for an EU company without one its EUID. Use the contracting entity named in the contract, not the group parent or the brand. Third-country providers are identified by LEI only.',
  },
  {
    q: 'What is a lapsed LEI twin?',
    a: `A second LEI that exists for the same or a similarly named entity but is LAPSED or RETIRED. Copying it into the register passes a format check and then fails the GLEIF status check. ${D.lapsed} of the ${D.total} providers here hold a lapsed LEI themselves; twins we found are listed on each card.`,
  },
  {
    q: 'Why does the GLEIF parent differ from the verified owner?',
    a: 'The parent in GLEIF is what the entity reported, often a reporting exception instead of a name. The verified owner comes from a register, annual report or filing. B_05.01 asks for the ultimate parent; where the two differ, the card shows both so you can decide which your contract evidence supports.',
  },
]

function Item({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="rule-fade pt-3">
      <dt className="text-xs font-semibold tracking-wider text-[var(--text-faint)] uppercase">{k}</dt>
      <dd className="mt-1 text-sm leading-6 break-words text-[var(--text)]">{children}</dd>
    </div>
  )
}

function Card({ r }: { r: Row }) {
  const lei = leiCode(r)
  const twins = lapsedTwins(r)
  const ctpp = ctppLine(r)
  return (
    <article id={r.slug} className="flex min-w-0 flex-col rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 font-display text-xl font-semibold text-white">{r.product}</h3>
        <VerdictPill verdict={r.verdict} />
      </div>
      {ctpp && (
        <p className="mt-3 inline-block self-start rounded-full border border-[var(--blue)] px-3 py-0.5 text-xs font-semibold text-[var(--blue-light)]">
          CTPP: {ctpp}
        </p>
      )}
      <dl className="mt-5 grid gap-y-3">
        <Item k="Entity as filed">
          {r.legal_entity || 'Not resolved'}
          {r.country ? ` (${r.country})` : ''}
        </Item>
        <Item k="LEI / EUID">
          {lei ? (
            <a
              href={`https://search.gleif.org/#/record/${lei}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[var(--blue-light)] underline-offset-4 hover:underline"
            >
              {lei}
            </a>
          ) : (
            <span>{r.lei || 'None found'}</span>
          )}
          {lei && isCandidateLei(r) ? ' (candidate, unconfirmed)' : ''}
          {r.registry_id ? <span className="block text-[var(--text-dim)]">Register: {r.registry_id}</span> : null}
        </Item>
        <Item k="GLEIF status · next renewal">
          {r.lei_status || '—'}
          {r.lei_renewal ? ` · ${r.lei_renewal}` : ''}
        </Item>
        <Item k="Ultimate parent, as GLEIF reports it">{r.gleif_parent || 'Nothing reported'}</Item>
        <Item k="Controlling owner, from documents">
          {r.verdict === 'unverified' ? (
            <span className="text-[var(--text-dim)]">Not verified</span>
          ) : (
            `${r.owner} (${r.owner_country})`
          )}
        </Item>
        {twins.length > 0 && (
          <Item k="Lapsed or retired twins to avoid">
            <ul className="space-y-1">
              {twins.map((t) => (
                <li key={t.lei}>
                  <span className="font-mono">{t.lei}</span>
                  <span className="block text-xs text-[var(--text-dim)]">{t.context}</span>
                </li>
              ))}
            </ul>
          </Item>
        )}
        <Item k="Source · checked">
          {r.source_url ? (
            <a
              href={r.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[var(--blue-light)] underline-offset-4 hover:underline"
            >
              {(() => {
                try {
                  return new URL(r.source_url).hostname.replace(/^www\./, '')
                } catch {
                  return r.source_url
                }
              })()}
            </a>
          ) : (
            'No primary document yet'
          )}
          {` · ${r.checked_on}`}
        </Item>
      </dl>
      <div className="mt-auto pt-6">
        <Link
          href="/dora-register"
          className="text-sm font-semibold text-[var(--blue-light)] underline-offset-4 hover:underline"
        >
          Paste your register: we flag every provider ID, lapsed twin and CTPP parent →
        </Link>
      </div>
    </article>
  )
}

export default function DoraProviders() {
  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'DORA Register Checker', path: '/dora-register' },
          { name: 'ICT providers', path: '/dora/providers' },
        ]}
      />
      <PageIntro eyebrow="DORA Register of Information" title="ICT providers: entity, LEI, parent and CTPP">
        <p>
          For anyone filling B_05.01 before the next 31 December reference date: the {D.total}{' '}
          contracting entities EU registers of information keep repeating, {D.ctpp} of which roll up to a
          critical third-party provider. Each card settles the entity as filed, the LEI or EUID, GLEIF
          status and next renewal, the parent GLEIF reports against the owner a document names, and the
          lapsed twins not to copy, on the same rows and evidence rule as{' '}
          <Link href="/really-european" className="text-white underline-offset-4 hover:underline">
            Really European?
          </Link>
        </p>
      </PageIntro>

      <div className="section-lift mt-6 py-14">
        <Container>
          <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['Providers', D.total, 'CTPPs and the entities registers repeat'],
                ['With an LEI', D.withLei, `${D.total - D.withLei} have no LEI on file`],
                ['Lapsed LEIs', D.lapsed, 'would fail the GLEIF status check'],
                ['Roll up to a CTPP', D.ctpp, 'designated by the ESAs, 18 Nov 2025'],
              ] as const
            ).map(([k, v, line]) => (
              <div key={k}>
                <dt className="text-sm text-[var(--text-dim)]">{k}</dt>
                <dd className="stat mt-2 font-display text-5xl font-semibold">{v}</dd>
                <p className="mt-2 text-sm text-[var(--text-faint)]">{line}</p>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      <Container className="mt-16">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-raised)] p-8 sm:p-10">
            <h2 className="font-display text-2xl font-medium text-white">Check your whole register instead</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              The DORA Register Checker reads your fifteen templates in the browser and flags every provider
              identifier, lapsed LEI and CTPP parent against GLEIF. Nothing is uploaded.
            </p>
            <div className="mt-6">
              <Button href="/dora-register">Check a register</Button>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {SORTED.map((r) => (
            <Card key={r.slug} r={r} />
          ))}
        </div>
        <p className="mt-8 text-sm text-[var(--text-faint)]">
          Checked {META.checked_on}. {META.evidence_rule} Download every row:{' '}
          <a href={CSV_PATH} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
            really-european.csv
          </a>{' '}
          (CC0).
        </p>
      </Container>

      <Container className="mt-20">
        <FadeIn>
          <div className="rule-fade pt-10">
            <Faq items={FAQ} />
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
