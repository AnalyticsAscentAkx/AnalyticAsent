import { type Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { RootLayout } from '@/components/RootLayout'
import { SoftwareStructuredData } from '@/components/StructuredData'
import { HeroFx } from './HeroFx'
import { Optimiser } from './Optimiser'
import benchmark from '@/lib/cm/benchmark.json'

const b = benchmark
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`

export const metadata: Metadata = {
  title: 'Quote Matcher — price a part from ones you have already quoted',
  description:
    'Match a new RFQ part against the parts you have already quoted, and anchor its price to them. Runs entirely in your browser — nothing you upload is sent anywhere.',
}

const DOWNLOADS = [
  ['catalogue.csv', 'The full sample catalogue, 4,000 quoted parts'],
  ['demo_rfq.csv', 'The five held-out parts used as demo queries'],
  ['alloys.csv', '31 grades with density, machinability, price and carbon'],
  ['generate.py', 'The catalogue generator, with its seed'],
  ['engine.py', 'The reference matching engine'],
  ['tune.py', 'Weight tuning against held-out siblings'],
  ['benchmark.py', 'Every number on this page, reproducible'],
]

export default function CmOptimiser() {
  return (
    <RootLayout>
      <SoftwareStructuredData
        name="Quote Matcher"
        description="Match a new part against parts already quoted and anchor its price to them. Runs entirely in the browser; nothing is uploaded."
        path="/cm-optimiser"
      />
      {/* ---------------------------------------------------------- hero --- */}
      <div className="relative isolate overflow-hidden bg-[var(--bg-raised)]">
        <HeroFx
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.75) 58%, #000 78%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 34%, rgba(0,0,0,0.75) 58%, #000 78%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-neutral-50"
          aria-hidden="true"
        />
        <Container className="relative pt-24 pb-20 sm:pt-32 sm:pb-24 lg:pt-40">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-medium tracking-tight text-balance text-white sm:text-6xl">
              You have quoted this part before.
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-[var(--text-dim)]">
              Give it the part you are pricing today and it finds the closest things in your quote
              history, tells you what they went out at, and says plainly when there is nothing close
              enough to be worth trusting.
            </p>

            <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-x-10 gap-y-6 border-t border-[var(--line-bright)] pt-6 sm:grid-cols-3">
              <div>
                <dd className="font-display text-3xl font-medium text-white tabular-nums">
                  {pct(b.recallAt10)}
                </dd>
                <dt className="mt-1 text-sm text-[var(--text-dim)]">
                  of a part&apos;s true siblings reach the top ten
                </dt>
              </div>
              <div>
                <dd className="font-display text-3xl font-medium text-white tabular-nums">
                  ±{pct(b.priceMedape)}
                </dd>
                <dt className="mt-1 text-sm text-[var(--text-dim)]">median error on the price anchor</dt>
              </div>
              <div>
                <dd className="font-display text-3xl font-medium text-white tabular-nums">
                  {b.nQueries.toLocaleString('en-GB')}
                </dd>
                <dt className="mt-1 text-sm text-[var(--text-dim)]">
                  held-out parts it was measured on
                </dt>
              </div>
            </dl>

            <p className="mt-8 max-w-2xl text-sm leading-6 text-[var(--text-dim)]">
              Everything below runs in this browser tab. The catalogue is downloaded once and the
              matching happens on your machine, so a file you drop in never reaches a server — not
              ours, not anyone&apos;s. There is nothing to sign up for.
            </p>
          </div>
        </Container>
      </div>

      {/* ---------------------------------------------------------- tool --- */}
      <Container className="mt-16 sm:mt-20">
        <Optimiser />
      </Container>

      {/* ------------------------------------------------------- downloads --- */}
      <Container className="mt-20 sm:mt-28">
        <div className="border-t border-[var(--line)] pt-8">
          <h2 className="font-display text-2xl font-semibold text-white">
            Take it apart
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
            A demo built on a catalogue nobody can inspect proves nothing. The generator, its seed,
            the cost model, the tuning and the benchmark are all here. Change the dimensions, break
            the grades, re-upload it, and watch the match bands and the guardrail respond.
          </p>
          <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {DOWNLOADS.map(([file, what]) => (
              <li key={file} className="flex gap-4 border-t border-[var(--line)] pt-4">
                <a
                  href={`/cm-optimiser/downloads/${file}`}
                  download
                  className="font-medium text-[var(--blue-light)] underline-offset-4 hover:underline"
                >
                  {file}
                </a>
                <span className="text-sm text-[var(--text-dim)]">{what}</span>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* ------------------------------------------------------ the honest --- */}
      <Container className="mt-20 sm:mt-28">
        <div className="grid gap-12 border-t border-[var(--line)] pt-8 lg:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              The catalogue is synthetic
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
              No open dataset of real machined parts with real prices exists, so the sample here is
              generated from a published cost model. It is good enough to prove the matching works
              and to be benchmarked honestly. It is not evidence about your prices — that is what
              uploading your own history is for.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Carbon figures are indicative
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
              Material-only, cradle-to-gate, from published emission factors. Accuracy is ±30% or
              worse depending on region and recycled content, and machining energy is not counted.
              Useful for comparing one grade against another. Not a footprint, and not ISO 14067.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Where your data lives
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
              In your browser, for as long as the tab is open. Nothing is uploaded, stored or
              logged, and closing the tab is the deletion step. If your quote history cannot leave
              the building at all, the same engine runs offline as a script under NDA.
            </p>
          </div>
        </div>
      </Container>

      {/* ------------------------------------------------------------ CTA --- */}
      <Container className="mt-20 mb-32 sm:mt-28 sm:mb-40">
        <div className="rounded-3xl bg-[var(--bg-raised)] px-6 py-16 sm:px-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-medium text-white sm:text-4xl">
              Run it on your own quotes
            </h2>
            <p className="mt-4 text-[var(--text-dim)]">
              Drop a file above and it works today, against your history, in your browser. What a
              pilot adds is the part that cannot be done in a tab: tuning the weights on your data,
              parsing your descriptions properly, and reading quotes out of the system they already
              live in. Your data is in SAP, Odoo, Exact or Excel — we connect the one you actually
              use, once we have seen it.
            </p>
            <Link
              href="/contact?subject=CM%20Optimiser"
              className="mt-8 inline-flex rounded-full bg-[var(--bg)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--line-bright)]"
            >
              Book a 20-minute call
            </Link>
          </div>
        </div>
      </Container>
    </RootLayout>
  )
}
