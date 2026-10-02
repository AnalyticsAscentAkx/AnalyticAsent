import { type Metadata } from 'next'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { CaseFigure } from '@/components/Charts'
import { CASE_STUDIES } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Engagements across part matching, route optimisation and financial modelling, inventory planning, auction bidding, taxonomy classification and internal tooling. Described without naming clients.',
}

export default function Work() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Work" title="The problems, and what actually moved">
        <p>
          Clients are not named. Sector and size are enough to judge whether a
          problem resembles yours, and the figures below are the ones that were
          measured rather than the ones that sound best.
        </p>
      </PageIntro>

      <Container className="mt-20 sm:mt-28">
        <div className="space-y-20 sm:space-y-28">
          {CASE_STUDIES.map((cs, i) => (
            <FadeIn key={cs.slug}>
              <article className="border-t border-[var(--line)] pt-10">
                <div className="grid gap-10 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <p className="text-sm text-[var(--blue-light)]">{cs.sector}</p>
                    <h2 className="mt-3 font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                      {cs.href ? (
                        <Link
                          href={cs.href}
                          className="transition hover:text-[var(--blue-light)]"
                          {...(cs.href.startsWith('http')
                            ? {
                                target: '_blank',
                                rel: cs.ownProduct ? 'noopener' : 'noopener noreferrer',
                              }
                            : {})}
                        >
                          {cs.title}
                        </Link>
                      ) : (
                        cs.title
                      )}
                    </h2>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {cs.tags.map((t) => (
                        <li
                          key={t}
                          className="rounded-full border border-[var(--line-bright)] px-3 py-1 text-xs text-[var(--text-dim)]"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                    {cs.href && (
                      <Link
                        href={cs.href}
                        className="mt-6 inline-block text-sm font-semibold text-white underline-offset-4 transition hover:text-[var(--blue-light)] hover:underline"
                        {...(cs.href.startsWith('http')
                          ? {
                              target: '_blank',
                              rel: cs.ownProduct ? 'noopener' : 'noopener noreferrer',
                            }
                          : {})}
                      >
                        {cs.hrefLabel}
                      </Link>
                    )}
                  </div>

                  <div className="lg:col-span-8">
                    <dl className="space-y-6">
                      <div>
                        <dt className="font-display text-sm font-semibold text-white">
                          The problem
                        </dt>
                        <dd className="mt-2 text-[var(--text-dim)]">{cs.problem}</dd>
                      </div>
                      <div>
                        <dt className="font-display text-sm font-semibold text-white">
                          What we did
                        </dt>
                        <dd className="mt-2 text-[var(--text-dim)]">{cs.approach}</dd>
                      </div>
                      <div>
                        <dt className="font-display text-sm font-semibold text-white">
                          Where it landed
                        </dt>
                        <dd className="mt-2 text-[var(--text-dim)]">{cs.outcome}</dd>
                      </div>
                    </dl>

                    {cs.chart && <CaseFigure chart={cs.chart} />}

                    <dl className="mt-8 grid gap-6 border-t border-[var(--line)] pt-6 sm:grid-cols-3">
                      {cs.metrics.map((m) => (
                        <div key={m.label}>
                          <dd className="font-display text-3xl font-medium text-white tabular-nums">
                            {m.value}
                          </dd>
                          <dt className="mt-1 text-sm leading-5 text-[var(--text-faint)]">
                            {m.label}
                          </dt>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
