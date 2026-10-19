import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { VerdictPill } from '@/components/really-european/VerdictPill'
import {
  FEATURED,
  FEATURED_SLUGS,
  GLEIF_VIEW_LABEL,
  META,
  VERDICT_LINE,
  answer,
  badgePath,
  clip,
  gleifView,
  leiCode,
  ownerRegion,
  rowBySlug,
  shortName,
  type Row,
} from '@/lib/really-european'
import { pageMetadata } from '@/lib/site'

// One page per name people search for ("is spotify european owned", "is
// hetzner eu based"), and only for those. Everything else lives in the table
// and the checker.

export const dynamicParams = false

export function generateStaticParams() {
  return FEATURED.map((r) => ({ slug: r.slug }))
}

function load(slug: string): Row {
  const r = FEATURED_SLUGS.has(slug) ? rowBySlug(slug) : undefined
  if (!r) notFound()
  return r
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const r = load((await params).slug)
  const name = shortName(r)
  return pageMetadata({
    title: `Is ${name} European? Who owns ${name}`,
    ogTitle: `Is ${name} European?`,
    description: clip(answer(r)),
    path: `/really-european/${r.slug}`,
    keywords: [`is ${name.toLowerCase()} european`, `who owns ${name.toLowerCase()}`, `${name.toLowerCase()} owner`],
  })
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const r = load((await params).slug)
  const name = shortName(r)
  const lei = leiCode(r)
  const region = ownerRegion(r)
  const others = FEATURED.filter((x) => x.slug !== r.slug && x.category === r.category).slice(0, 6)

  const faq = [
    { q: `Is ${name} European?`, a: answer(r) },
    {
      q: `Who owns ${name}?`,
      a:
        r.verdict === 'unverified'
          ? `We could not verify it from a free primary document as of ${r.checked_on}, so we do not name a controlling owner. Our notes on the page say what we found and what is missing.`
          : `${r.owner} (${r.owner_country}). Source: ${r.source_url}, checked ${r.checked_on}.`,
    },
    {
      q: `Does ${name} have an LEI?`,
      a: lei
        ? `Yes: ${r.legal_entity} holds LEI ${lei}${r.lei_status ? `, status ${r.lei_status}` : ''}${r.lei_renewal ? `, next renewal ${r.lei_renewal}` : ''}. As GLEIF reports its parent: ${r.gleif_parent || 'nothing reported'}.`
        : `We found no LEI for ${r.legal_entity || name} in GLEIF on ${r.checked_on}. That is common: most European companies outside finance never need one.`,
    },
  ]

  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Really European?', path: '/really-european' },
          { name: `Is ${name} European?`, path: `/really-european/${r.slug}` },
        ]}
      />
      <PageIntro eyebrow="Really European?" title={`Is ${name} European?`}>
        <p>{answer(r)}</p>
        {/* No hand-written sentence per company, by design: the answer above is
            generated from the row, so it can never say more than the verdict. */}
      </PageIntro>

      <Container className="mt-10">
        <FadeIn>
          <article className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-4">
              <VerdictPill verdict={r.verdict} className="text-sm" />
              <span className="text-sm text-[var(--text-dim)]">checked {r.checked_on}</span>
            </div>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">{VERDICT_LINE[r.verdict]}</p>
            <dl className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {(
                [
                  ['Legal entity', `${r.legal_entity || 'Not resolved'}${r.country ? ` (${r.country})` : ''}`],
                  ['Register id', r.registry_id || 'None found'],
                  ['LEI', lei ? `${r.lei}${r.lei_status ? ` · ${r.lei_status}` : ''}${r.lei_renewal ? ` · renews ${r.lei_renewal}` : ''}` : r.lei || 'None'],
                  ['What GLEIF shows', `${GLEIF_VIEW_LABEL[gleifView(r)]}. ${r.gleif_parent || ''}`],
                  [
                    'Controlling owner, from documents',
                    r.verdict === 'unverified' ? 'Not verified' : `${r.owner} (${r.owner_country}; ${region})`,
                  ],
                  ['Control type', r.control_type],
                  ['Listed on', r.listed_on.join(', ') || '—'],
                  ['Category', r.category],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="rule-fade pt-3">
                  <dt className="text-xs font-semibold tracking-wider text-[var(--text-faint)] uppercase">{k}</dt>
                  <dd className="mt-1 text-sm leading-6 break-words text-[var(--text)]">{v}</dd>
                </div>
              ))}
              <div className="rule-fade pt-3">
                <dt className="text-xs font-semibold tracking-wider text-[var(--text-faint)] uppercase">Source</dt>
                <dd className="mt-1 text-sm leading-6">
                  {r.source_url ? (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-[var(--blue-light)] underline-offset-4 hover:underline"
                    >
                      {host(r.source_url)}
                    </a>
                  ) : (
                    <span className="text-[var(--text-dim)]">No free primary document found</span>
                  )}
                </dd>
              </div>
              {lei && (
                <div className="rule-fade pt-3">
                  <dt className="text-xs font-semibold tracking-wider text-[var(--text-faint)] uppercase">GLEIF record</dt>
                  <dd className="mt-1 text-sm leading-6">
                    <a
                      href={`https://search.gleif.org/#/record/${lei}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[var(--blue-light)] underline-offset-4 hover:underline"
                    >
                      {lei}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {r.notes && (
              <div className="mt-8">
                <h2 className="font-display text-lg font-semibold text-white">Our notes</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{r.notes}</p>
              </div>
            )}
          </article>
        </FadeIn>
      </Container>

      <Container className="mt-16">
        <FadeIn>
          <div className="rule-fade grid gap-10 pt-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-medium text-white">Embed this answer</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgePath(r.slug)} alt={`${name} ownership: ${r.verdict}, checked ${r.checked_on}`} className="mt-4 h-5" />
              <p className="mt-4 text-sm text-[var(--text-dim)]">
                <Link href={`/really-european/badge?slug=${r.slug}`} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                  Get the embed code
                </Link>{' '}
                · data CC0, version {META.version}
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-medium text-white">Check another</h2>
              <div className="mt-4 flex flex-wrap gap-4">
                <Button href="/really-european/check">Open the checker</Button>
                <Link
                  href="/really-european"
                  className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
                >
                  All rows
                </Link>
              </div>
              {others.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {others.map((o) => (
                    <li key={o.slug}>
                      <Link
                        href={`/really-european/${o.slug}`}
                        className="inline-block rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--text-dim)] hover:text-white"
                      >
                        Is {shortName(o)} European?
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20">
        <FadeIn>
          <div className="rule-fade pt-10">
            <Faq items={faq} title={`${name}: the short answers`} />
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
