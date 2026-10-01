import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { HeroField } from '@/components/HeroField'
import { RootLayout } from '@/components/RootLayout'
import { CAPABILITIES, CASE_STUDIES, LINKS, PUBLICATION } from '@/lib/content'
import { ALL_ARTICLES, RECENT, formatDate } from '@/lib/writing'

export const metadata: Metadata = {
  description:
    'Analytics and optimisation for operations: part matching and should-cost benchmarking, route and collection optimisation, inventory planning, pricing and bidding models.',
}

export default function Home() {
  const featured = CASE_STUDIES.slice(0, 3)

  return (
    <RootLayout>
      {/* ------------------------------------------------------------ hero */}
      <div className="relative isolate overflow-hidden">
        <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_40%,rgba(7,11,22,0.96),rgba(7,11,22,0.6)_60%,transparent)]"
        />
        <Container className="relative pt-24 pb-24 sm:pt-32 sm:pb-28 lg:pt-40">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl leading-[1.05] font-medium tracking-tight text-balance text-white sm:text-6xl lg:text-7xl">
              The answer is usually already in your data.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-dim)] sm:text-xl">
              I build the models and tools that get it out: pricing a new part
              from the ones you have already quoted, cutting collection rounds
              without cutting tonnage, holding stock that matches demand, bidding
              what a slot is actually worth.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
              <Button href="/work">See the work</Button>
              <Link
                href="/cm-optimiser"
                className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
              >
                Try a live tool
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* ------------------------------------------------- what I work on */}
      <Container className="mt-8 sm:mt-12">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-6">
            <p className="max-w-3xl text-[var(--text-dim)]">
              Six things, all the same shape underneath: a set of options, a
              constraint, and a better way to choose than the one in use.
            </p>
          </div>
        </FadeIn>
        <dl className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <FadeIn key={c.slug}>
              <div className="group border-t border-[var(--line)] pt-5">
                <dt className="font-display text-lg font-semibold text-white">
                  {c.title}
                </dt>
                <dd className="mt-2 text-[var(--text-dim)]">{c.lede}</dd>
                <p className="mt-4 text-sm text-[var(--blue-light)]">{c.proof}</p>
              </div>
            </FadeIn>
          ))}
        </dl>
      </Container>

      {/* ------------------------------------------------------ selected work */}
      <div className="mt-24 bg-[var(--bg-raised)] py-24 sm:mt-32 sm:py-28">
        <Container>
          <FadeIn>
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
              <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Selected work
              </h2>
              <Link
                href="/work"
                className="text-sm font-semibold text-[var(--blue-light)] transition hover:text-white"
              >
                All six case studies
              </Link>
            </div>
          </FadeIn>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {featured.map((cs) => (
              <FadeIn key={cs.slug}>
                <article className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-7 transition hover:border-[var(--blue)]/50">
                  <p className="text-sm text-[var(--text-faint)]">{cs.sector}</p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-white">
                    {cs.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-6 text-[var(--text-dim)]">
                    {cs.problem}
                  </p>
                  <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-5">
                    {cs.metrics.map((m) => (
                      <div key={m.label}>
                        <dd className="font-display text-lg font-semibold text-[var(--blue-light)] tabular-nums">
                          {m.value}
                        </dd>
                        <dt className="mt-1 text-xs leading-4 text-[var(--text-faint)]">
                          {m.label}
                        </dt>
                      </div>
                    ))}
                  </dl>
                  {cs.href && (
                    <Link
                      href={cs.href}
                      className="mt-6 text-sm font-semibold text-white transition hover:text-[var(--blue-light)]"
                      {...(cs.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {cs.hrefLabel}
                    </Link>
                  )}
                </article>
              </FadeIn>
            ))}
          </div>
        </Container>
      </div>

      {/* ------------------------------------------------------------ tool */}
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-raised)]">
            <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
              <div>
                <p className="text-sm font-semibold text-[var(--blue-light)]">
                  Live in your browser, nothing uploaded
                </p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                  Price a part against 4,000 you have already quoted
                </h2>
                <p className="mt-5 text-[var(--text-dim)]">
                  The part-matching engine, running as a public demo. Drop in
                  your own quote history and it matches against that instead —
                  the file never leaves the tab, because the whole thing runs on
                  your machine.
                </p>
                <div className="mt-8">
                  <Button href="/cm-optimiser">Open Quote Matcher</Button>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-6">
                {[
                  ['95.0%', 'recall at ten, on 1,000 held-out parts'],
                  ['±36.5%', 'median error on the price anchor'],
                  ['+22.6', 'points of recall from enrichment'],
                  ['81%', 'of prices inside the stated range'],
                ].map(([v, l]) => (
                  <div key={l} className="border-t border-[var(--line-bright)] pt-4">
                    <dd className="font-display text-2xl font-medium text-white tabular-nums">
                      {v}
                    </dd>
                    <dt className="mt-1 text-sm leading-5 text-[var(--text-faint)]">
                      {l}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ----------------------------------------------------- data clinic */}
      <Container className="mt-10">
        <FadeIn>
          <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)]">
            <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-[var(--blue-light)]">
                  Also live, also in your browser
                </p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-white">
                  Bring the messy version
                </h2>
                <p className="mt-5 text-[var(--text-dim)]">
                  Every engagement starts with a file somebody apologises for. Drop one in and the
                  Data Clinic names what is actually wrong with it — duplicate rows, two decimal
                  conventions, dates in two orders, the same value spelled three ways — and hands
                  back a cleaned copy.
                </p>
                <div className="mt-8">
                  <Button href="/data-clinic">Open the Data Clinic</Button>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-[var(--text-dim)]">
                {[
                  'Duplicate rows',
                  'Mixed units',
                  'Two decimal conventions',
                  'Dates in two orders',
                  'Numbers stored as text',
                  'One value, three spellings',
                  'Hidden placeholders',
                  'Stray whitespace',
                ].map((c) => (
                  <li key={c} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-[var(--blue)]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* --------------------------------------------------------- writing */}
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
            <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Writing
            </h2>
            <a
              href={LINKS.substackSubscribe}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
            >
              Subscribe to {PUBLICATION.name}
            </a>
          </div>
        </FadeIn>
        <p className="mt-6 max-w-2xl text-[var(--text-dim)]">
          {ALL_ARTICLES.length} published pieces, mostly things that had to be worked out for a
          project and were written down so they would not have to be worked out twice.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {RECENT.map((a) => (
            <FadeIn key={a.href}>
              <li className="h-full">
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block h-full rounded-2xl border border-[var(--line)] p-6 transition hover:border-[var(--blue)]/50 hover:bg-[var(--bg-raised)]"
                >
                  <p className="text-xs text-[var(--text-faint)] tabular-nums">
                    {formatDate(a.date)}
                  </p>
                  <h3 className="mt-2 font-display font-semibold text-white transition group-hover:text-[var(--blue-light)]">
                    {a.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{a.hook}</p>
                </a>
              </li>
            </FadeIn>
          ))}
        </ul>
        <div className="mt-8">
          <Link
            href="/insights"
            className="text-sm font-semibold text-[var(--blue-light)] transition hover:text-white"
          >
            All {ALL_ARTICLES.length} pieces
          </Link>
        </div>
      </Container>

      {/* ------------------------------------------------------- authority */}
      <div className="mt-24 border-y border-[var(--line)] bg-[var(--bg-raised)] py-20 sm:mt-32">
        <Container>
          <FadeIn>
            <div className="max-w-3xl">
              <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                You can check every claim on this page
              </h2>
              <p className="mt-5 text-lg text-[var(--text-dim)]">
                Anyone can write a number on a website. The difference worth paying for is whether
                it survives being looked at, so everything here is built to be looked at.
              </p>
            </div>
          </FadeIn>
          <dl className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-3">
            {[
              [
                'The tools run on your data',
                'Two of them, live on this site, in your browser. Upload your own quote history or your own messy export and see what comes back. Nothing is sent to a server, so there is nothing to agree to first.',
              ],
              [
                'The numbers are measured, not asserted',
                'Recall, price error and coverage all come from parts held out of the catalogue entirely. The generator, the cost model, the tuning and the benchmark script are downloadable — change the seed and re-run them.',
              ],
              [
                'The method is published',
                `${ALL_ARTICLES.length} pieces going back to ${PUBLICATION.since}, including the full write-up of the route-optimisation method behind one of the case studies.`,
              ],
            ].map(([title, body]) => (
              <FadeIn key={title}>
                <div className="border-t border-[var(--line-bright)] pt-5">
                  <dt className="font-display text-lg font-semibold text-white">{title}</dt>
                  <dd className="mt-3 text-[var(--text-dim)]">{body}</dd>
                </div>
              </FadeIn>
            ))}
          </dl>
          <FadeIn>
            <p className="mt-14 max-w-3xl border-t border-[var(--line)] pt-8 text-[var(--text-dim)]">
              Analytics Ascent is the practice of{' '}
              <a
                href="https://www.linkedin.com/in/aakashcr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline-offset-4 hover:text-[var(--blue-light)] hover:underline"
              >
                Dr Aakash Chavan
              </a>
              . Engagements have covered aerospace machining, waste and recycling, hardware
              manufacturing and a consumer marketplace — and the person who writes the code is the
              person you talk to.
            </p>
          </FadeIn>
        </Container>
      </div>

      {/* ------------------------------------------------------------- CTA */}
      <Container className="mt-24 mb-32 sm:mt-32 sm:mb-40">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] px-6 py-16 sm:px-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Bring the messy version
              </h2>
              <p className="mt-5 text-[var(--text-dim)]">
                The interesting problems arrive as a spreadsheet nobody trusts
                and a question somebody needs answered on Thursday. That is the
                normal starting point, not a reason to wait until the data is
                tidy.
              </p>
              <div className="mt-8">
                <Button href="/contact">Start a conversation</Button>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
