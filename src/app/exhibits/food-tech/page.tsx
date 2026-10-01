import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { Resolver } from './Resolver'

export const metadata: Metadata = {
  title: 'Who owns what in food technology',
  description:
    'A corporate structure dataset for food and food-technology groups: legal entities resolved to parents from the LEI register and joined to EU research funding. Free to download, with the error cases published.',
}

const SOURCES = [
  [
    'GLEIF LEI register',
    'Every legal entity with an LEI: registered name, jurisdiction, status, and the parent the entity has reported itself. Open licence, no key.',
  ],
  [
    'CORDIS',
    'Every Horizon Europe participation with the EC contribution in euro. Open data, no key. Carries no company identifier, so the link back is a name match.',
  ],
  [
    'Seed list',
    'Food and food-technology groups, typed the way a person would type them rather than as tidy legal names — because resolving the messy string is the exercise.',
  ],
]

export default function FoodTechExhibit() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Exhibit" title="Who owns what in food technology">
        <p>
          The data is public. It is just scattered across registers that do not share an
          identifier, so nobody has joined it. Joining it is the work.
        </p>
      </PageIntro>

      <Container className="mt-14">
        <FadeIn>
          <Resolver />
        </FadeIn>
      </Container>

      {/* -------------------------------------------------------- download --- */}
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-8 sm:p-12">
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
                ['groups.csv', 'One row per group: hierarchy, countries, EU funding'],
                ['uncertain.csv', 'Everything the method could not place confidently'],
              ].map(([file, what]) => (
                <li key={file} className="border-t border-[var(--line)] pt-4">
                  <a
                    href={`/exhibits/food-tech/downloads/${file}`}
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

      {/* --------------------------------------------------------- sources --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">What went in</h2>
            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
              {SOURCES.map(([name, detail]) => (
                <div key={name} className="border-t border-[var(--line)] pt-4">
                  <dt className="font-display font-semibold text-white">{name}</dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{detail}</dd>
                </div>
              ))}
            </dl>
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
                occasionally out of date about fact. Dates are shown so you can judge.
              </p>
              <p>
                <span className="text-white">The funding join is a name match.</span> CORDIS holds
                no company identifier. The join is deliberately conservative, so it will miss
                grants before it invents them — under-counting, not over-counting.
              </p>
              <p>
                <span className="text-white">No patent data.</span> Every patent register worth
                using — Lens, EPO OPS, PatentsView — needs an API key and carries its own licence
                terms for derived datasets. That layer is scoped but not built.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------------- CTA --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-raised)] px-6 py-16 sm:px-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Your sources, merged the same way
              </h2>
              <p className="mt-5 text-[var(--text-dim)]">
                This took public registers that share no identifier and produced something
                checkable. The same problem usually turns up inside a company first: a CRM, an ERP
                and a billing system that each believe a customer is called something different.
                The useful version of this work resolves your sources and hands back a pipeline you
                own.
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

      <ContactSection />
    </RootLayout>
  )
}
