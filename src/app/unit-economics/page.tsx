import { type Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { RootLayout } from '@/components/RootLayout'
import { SoftwareStructuredData } from '@/components/StructuredData'
import { UnitEconomics } from './Model'

export const metadata: Metadata = {
  title: 'Unit economics and break-even calculator',
  description:
    'Free unit economics and break-even calculator: contribution margin, break-even volume, sensitivity analysis and a demand forecast. Runs in your browser.',
  alternates: { canonical: '/unit-economics' },
  openGraph: {
    title: 'Unit economics calculator — find the assumption your case turns on',
    description: 'Free unit economics and break-even calculator: contribution margin, break-even volume, sensitivity analysis and a demand forecast. Runs in your browser.',
    url: '/unit-economics',
    images: ['/opengraph-image'],
  },
  keywords: [
    'unit economics calculator',
    'break even analysis',
    'break even calculator',
    'contribution margin formula',
    'contribution margin per unit',
    'cost per unit calculator',
    'sensitivity analysis',
    'demand forecasting',
    'financial modelling',
  ],
}

// Terms here are the ones people actually search for — "contribution margin",
// "break-even volume", "sensitivity analysis" — used because they are the
// correct words for these things, not sprinkled in. Writing "margin of safety"
// where the field is called margin of safety costs nothing and happens to be
// what someone types into a search box.
const FORMULAE = [
  [
    'Contribution margin per unit',
    'Price per unit minus every variable cost per unit. What one more sale actually leaves behind once the costs that scale with it are paid.',
  ],
  [
    'Break-even volume',
    'Fixed costs divided by contribution per unit. Below it you are funding the business; above it you are running one.',
  ],
  [
    'Margin of safety',
    'How far volume can fall before break-even. The number worth putting in a board paper, because it answers "how wrong can we be".',
  ],
  [
    'Sensitivity analysis',
    'Each input moved by the same amount to see which one moves the answer. Usually one does and the rest barely matter.',
  ],
]

const FAQ = [
  { q: 'What is the break-even formula?', a: 'Break-even volume equals fixed costs divided by contribution margin per unit. Contribution margin per unit is the selling price minus every variable cost per unit. So a business with 11,500 of fixed costs a month and a contribution of 60 per unit breaks even at 192 units a month.' },
  { q: 'What is contribution margin, and how is it different from gross margin?', a: 'Contribution margin is price minus the costs that vary with each unit sold, so it tells you what one more sale leaves behind. Gross margin subtracts cost of goods sold, which usually mixes in costs that do not vary per unit. For a break-even question, contribution margin is the one that matters, because only it scales with volume.' },
  { q: 'What is margin of safety?', a: 'How far volume can fall before you stop breaking even, expressed as a percentage of current volume. If you sell 240 units and break even at 192, the margin of safety is 20 per cent. It is the number worth putting in a board paper, because it answers how wrong the forecast can be before the decision changes.' },
  { q: 'What is sensitivity analysis and why does it matter more than the break-even number?', a: 'Sensitivity analysis moves each input by the same amount and records how far the answer shifts, which ranks the inputs by how much they matter. Break-even tells you the answer under one set of assumptions; sensitivity tells you which assumption to go and verify. Usually one input dominates and arguing about the rest is wasted effort.' },
  { q: 'Can a business have no break-even point?', a: 'Yes. If contribution margin per unit is zero or negative, every sale loses money before any fixed cost is covered, so no volume breaks even. Growth makes that worse rather than better: the price or the variable cost has to change.' },
  { q: 'How accurate is a demand forecast like this?', a: "The projection here uses Holt's linear trend and reports a 95 per cent interval derived from its own errors on the history it has seen, so a series that has been erratic produces a visibly wider band. No method of this kind can anticipate a contract starting, a price change, or a season absent from the history." },
]

export default function UnitEconomicsPage() {
  return (
    <RootLayout>
      <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Unit economics calculator', path: '/unit-economics' }]} />
      <SoftwareStructuredData
        name="Unit economics calculator"
        description="Break-even, contribution margin, sensitivity analysis and demand forecasting in the browser. Nothing is uploaded."
        path="/unit-economics"
      />
      <PageIntro eyebrow="Unit economics" title="What has to be true for this to make money">
        <p>
          A break-even calculation takes thirty seconds and nobody needs help with the arithmetic.
          The useful question is which of the numbers you fed it you actually need to be right
          about — because most business cases are one assumption wearing a spreadsheet, and
          finding that assumption is the whole job.
        </p>
      </PageIntro>

      <Container className="mt-14">
        <FadeIn>
          <UnitEconomics />
        </FadeIn>
      </Container>

      {/* -------------------------------------------------------- formulae --- */}
      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">
              What each number means
            </h2>
            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {FORMULAE.map(([term, meaning]) => (
                <div key={term} className="border-t border-[var(--line)] pt-4">
                  <dt className="font-display font-semibold text-white">{term}</dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeIn>
      </Container>

      {/* ---------------------------------------------------- the real one --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              The collection preset is a real engagement
            </h2>
            <p className="mt-5 max-w-3xl text-[var(--text-dim)]">
              An operating plan showed a loss and the conclusion drawn from it was that the
              contract was unviable. The plan rested on a payload figure nobody had checked against
              the vehicles in the yard: it had been understated by nearly a third, and payload sits
              upstream of route counts, fuel, driver hours and disposal trips, so correcting it
              moved everything at once. The corrected model showed a profit.
            </p>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              Nothing about that required a better spreadsheet. It required noticing which input
              the answer turned on, which is exactly what the sensitivity ordering above is for.
              Load the collection preset and move the costs around — the top row changes, and the
              argument changes with it.
            </p>
            <div className="mt-8">
              <Link
                href="/work"
                className="text-sm font-semibold text-[var(--blue-light)] transition hover:text-white"
              >
                Read the case study
              </Link>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------- honesty --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">
              Where a model like this stops
            </h2>
            <div className="mt-6 grid gap-x-12 gap-y-6 text-[var(--text-dim)] lg:grid-cols-2">
              <p>
                <span className="text-white">A single average unit is a simplification.</span> Real
                businesses have a mix, and the mix moves. If one product subsidises another, one
                blended contribution margin will hide it.
              </p>
              <p>
                <span className="text-white">Fixed costs are only fixed over a range.</span> Double
                the volume and you buy another vehicle, another shift, another site. The step is
                invisible to a straight line through break-even.
              </p>
              <p>
                <span className="text-white">The forecast extrapolates shape, nothing more.</span>{' '}
                It cannot know about a contract starting, a price change or a season it has never
                seen. The widening interval is the honest part of it.
              </p>
              <p>
                <span className="text-white">Sensitivity is one input at a time.</span> Costs move
                together in practice — fuel and driver hours rarely rise alone — so treat the
                ordering as a guide to where to look, not a complete risk model.
              </p>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* ----------------------------------------------------------- CTA --- */}
      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] px-6 py-16 sm:px-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                When the real model is bigger than one page
              </h2>
              <p className="mt-5 text-[var(--text-dim)]">
                Multiple sites, a product mix, step costs, a rate to negotiate, a board paper that
                has to survive questions. We build those so the assumptions stay visible and every
                figure traces to a source — which means the answer changes when an assumption
                changes, rather than needing a rebuild.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="/contact?subject=Financial%20modelling">
                  Talk about your numbers
                </Button>
                <Link
                  href="/tools"
                  className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
                >
                  The other tools
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
