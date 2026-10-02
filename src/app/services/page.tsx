import { type Metadata } from 'next'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { CAPABILITIES } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Capabilities',
  description:
    'Part matching and should-cost benchmarking, route and collection optimisation, inventory and demand planning, pricing and bidding models, data engineering, decision support.',
}

export default function Services() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Capabilities" title="What we are actually good at">
        <p>
          Six areas, and they are more alike than they look. Each one comes down
          to choosing well under a constraint — which round to run, which part
          to price from, how much to hold, what to bid. The domain changes; the
          shape of the problem does not.
        </p>
      </PageIntro>

      <Container className="mt-20 sm:mt-28">
        <div className="space-y-16">
          {CAPABILITIES.map((c) => (
            <FadeIn key={c.slug}>
              <section className="grid gap-8 border-t border-[var(--line)] pt-10 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <h2 className="font-display text-2xl font-medium tracking-tight text-white">
                    {c.title}
                  </h2>
                  <p className="mt-3 text-lg text-[var(--blue-light)]">{c.lede}</p>
                </div>
                <div className="lg:col-span-7">
                  <p className="text-[var(--text-dim)]">{c.detail}</p>
                  <p className="mt-5 border-l-2 border-[var(--blue)] pl-4 text-sm text-[var(--text-dim)]">
                    {c.proof}
                  </p>
                </div>
              </section>
            </FadeIn>
          ))}
        </div>
      </Container>

      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-2xl font-medium text-white">
              How engagements usually run
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              {[
                [
                  'A week to find out',
                  'We take your messiest real extract and come back with what is actually in it, what it cannot answer, and whether the thing you want is achievable. Fixed price.',
                ],
                [
                  'Build the thing',
                  'Model, pipeline or tool, delivered in your stack with the assumptions visible. You get the code and the reasoning, not a black box and a retainer.',
                ],
                [
                  'Hand it over properly',
                  'Documentation your team can act on, and enough time working alongside them that the thing survives us leaving.',
                ],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-display font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
