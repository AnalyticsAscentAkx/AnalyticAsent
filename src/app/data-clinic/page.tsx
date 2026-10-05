import { type Metadata } from 'next'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { RootLayout } from '@/components/RootLayout'
import { SoftwareStructuredData } from '@/components/StructuredData'
import { Clinic } from './Clinic'

export const metadata: Metadata = {
  // "Data Clinic" is our name for it and nobody searches for it. The title
  // is the single strongest on-page signal, so it says what the thing is.
  // Google Suggest puts 'online', 'free' and 'excel' on almost every variant
  // of this query, and all three are true here.
  title: 'Free data cleaning tool for CSV and Excel',
  description:
    'A free data cleaning tool in your browser. Find duplicate rows, mixed units, two decimal conventions and inconsistent spellings, then download the clean CSV.',
  alternates: { canonical: '/data-clinic' },
  openGraph: {
    title: 'Data Clinic — find what is actually wrong with your spreadsheet',
    description: 'A free data cleaning tool in your browser. Find duplicate rows, mixed units, two decimal conventions and inconsistent spellings, then download the clean CSV.',
    url: '/data-clinic',
    images: ['/opengraph-image'],
  },
  keywords: [
    'data cleaning tool',
    'free data cleaning tool',
    'messy data',
    'clean csv online',
    'data quality check',
    'duplicate rows',
    'data profiling',
  ],
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

const FAQ = [
  { q: 'What is data cleaning?', a: 'Data cleaning is finding and correcting the errors that make a dataset unusable or misleading: duplicate rows, missing values disguised as placeholders, inconsistent spellings of the same thing, numbers stored as text, mixed units and mixed date formats. It is usually the largest part of any analysis.' },
  { q: 'What are the most common problems in a real spreadsheet?', a: 'Duplicate rows that double a total; the same value spelled several ways, which breaks every join and group-by; units written inside the values so the numbers are not comparable; two decimal conventions in one column, which is a factor of a thousand; dates in both ISO and day-month order, which are indistinguishable below the thirteenth; and placeholders such as N/A or TBC that get averaged as if they were data.' },
  { q: 'How do you find duplicate rows?', a: 'Compare rows after normalising them — trimming whitespace and ignoring case — because exact matching misses duplicates that differ only by a trailing space or a capital letter. Those near-identical rows are the ones that survive a visual check and still inflate a total.' },
  { q: 'Can I clean an Excel file, or only CSV?', a: 'Both. Drop in a .xlsx workbook or a .csv, .tsv or tab-separated export and it is read the same way. The first sheet with data in it is the one profiled. Dates come back as dates rather than as the long text Excel sometimes produces, and a column whose header is blank keeps its values instead of losing them. The old .xls binary format cannot be read by anything in a browser — save it as .xlsx or export it as CSV first, and the tool says so rather than failing silently.' },
  { q: 'My CSV opens as one column. Why?', a: 'Almost always the delimiter. Excel on a Dutch or German machine writes semicolons rather than commas, and some exports use tabs or pipes. This tool works out which character actually separates the fields by parsing a sample with each candidate and keeping the one that produces a consistent table, so a comma file whose description column is full of semicolons still reads correctly.' },
  { q: 'Is it safe to upload a spreadsheet to an online data cleaning tool?', a: "Usually that depends on the tool's hosting and retention policy. This one avoids the question: the file is read in your own browser and never sent anywhere, so there is no upload, no copy on a server and nothing to retain." },
]

export default function DataClinic() {
  return (
    <RootLayout>
      <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'Data Clinic', path: '/data-clinic' }]} />
      <SoftwareStructuredData
        name="Data Clinic"
        description="Profile a messy spreadsheet: duplicate rows, mixed units, two decimal conventions, inconsistent spellings. Runs entirely in the browser; nothing is uploaded."
        path="/data-clinic"
      />
      <PageIntro eyebrow="Data cleaning" title="Bring the messy version">
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
