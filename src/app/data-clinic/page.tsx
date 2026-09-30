import { type Metadata } from 'next'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { Clinic } from './Clinic'

export const metadata: Metadata = {
  title: 'Data Clinic',
  description:
    'Drop in a messy spreadsheet and see what is actually wrong with it: duplicate rows, mixed units, two decimal conventions, dates in two orders, the same value spelled three ways. Runs in your browser.',
}

const CHECKS = [
  ['Duplicate rows', 'Identical once case and stray spaces are ignored, so totals count them twice.'],
  ['Mixed units', 'Millimetres and inches in one column, or a unit on some values and not others.'],
  ['Two decimal conventions', 'A comma in some rows and a full stop in others — a factor of a thousand.'],
  ['Dates in two orders', 'ISO and day/month together. Below the 13th the two are indistinguishable.'],
  ['Numbers stored as text', 'The column sorts alphabetically, so 100 comes before 20.'],
  ['The same value, spelled three ways', 'Case, spacing and punctuation differences that break every join.'],
  ['Hidden placeholders', 'N/A, TBC, "-" and blanks, counted together rather than averaged into a number.'],
  ['Stray whitespace', 'Invisible on screen, enough to break an exact match.'],
]

export default function DataClinic() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Data Clinic" title="Bring the messy version">
        <p>
          Every engagement starts with a file somebody apologises for. This is the first hour of
          that work, running on your machine: it reads the spreadsheet, says what is actually wrong
          with it, and hands back a cleaned copy.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <Clinic />
        </FadeIn>
      </Container>

      <Container className="mt-24 sm:mt-32">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-8">
            <h2 className="font-display text-2xl font-medium text-white">What it looks for</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              Each of these comes from something that actually cost someone time. None of it is
              clever; all of it is the sort of thing that quietly makes a number wrong and survives
              three rounds of review because nobody can see it.
            </p>
            <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {CHECKS.map(([title, detail]) => (
                <div key={title} className="border-t border-[var(--line)] pt-4">
                  <dt className="font-display font-semibold text-white">{title}</dt>
                  <dd className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-xl font-semibold text-white">
              Where this stops, and what comes next
            </h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              This finds problems and fixes the mechanical ones. It will not tell you whether a
              blank means zero or unknown, which date order your supplier meant, or which of three
              spellings is the real customer — those need someone who knows the business. That
              conversation is the actual work, and it goes much faster once everyone is looking at
              the same list.
            </p>
            <p className="mt-4 text-[var(--text-dim)]">
              The same parsing runs inside{' '}
              <Link href="/cm-optimiser" className="text-[var(--blue-light)] hover:underline">
                the quote matcher
              </Link>
              , where cleaning the input first is worth 22.6 points of accuracy over matching on the
              raw file.
            </p>
          </div>
        </FadeIn>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
