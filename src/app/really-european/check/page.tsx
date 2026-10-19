import Link from 'next/link'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { SoftwareStructuredData } from '@/components/StructuredData'
import { FEATURED, META, ROWS, VERDICT_LINE, directoryStats } from '@/lib/really-european'
import { pageMetadata } from '@/lib/site'
import { Checker } from './Checker'

const S = directoryStats()

export const metadata = pageMetadata({
  title: 'Is it really European? Ownership checker',
  ogTitle: 'Is it really European? Check who controls it',
  description: `Type a product or company and see its legal entity, LEI, GLEIF parent and the owner a register or filing names, with the source and date. ${ROWS.length} rows; nothing uploaded.`,
  path: '/really-european/check',
  keywords: ['is it european', 'is it european owned', 'who owns', 'european company checker', 'LEI lookup', 'parent company lookup'],
})

const FAQ = [
  {
    q: 'Does the checker send what I type anywhere?',
    a: 'No. The dataset is downloaded once from this site and searched inside your browser. Only if you press the GLEIF button is the name sent, to api.gleif.org, not to us.',
  },
  {
    q: 'Why does the GLEIF result always say unverified?',
    a: `A parent in the LEI register is what the company reported about itself, and most European companies report none: in our directory sample ${S.noLei} of ${S.total} have no LEI and ${S.exception} report an exception. We only give a verdict when a register entry, annual report, filing or deal announcement names the owner.`,
  },
  {
    q: 'A company is missing or wrong. What now?',
    a: 'Send us the document that settles it through the contact page, addressed to the Analytics Ascent research desk. Corrections are logged in the dataset changelog with the date.',
  },
]

export default function CheckPage() {
  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Really European?', path: '/really-european' },
          { name: 'Checker', path: '/really-european/check' },
        ]}
      />
      <SoftwareStructuredData
        name="Is it really European? Ownership checker"
        description="Search a product or company for its legal entity, LEI, GLEIF-reported parent and the controlling owner a primary document names. Runs in the browser."
        path="/really-european/check"
      />
      <PageIntro eyebrow="Really European?" title="Is it really European?">
        <p>
          Type a product or company. You get the legal entity you actually contract with and its country,
          its LEI or none, the parent it reports to GLEIF or the exception it claims instead, the owner a
          register or filing names, the source and the date we read it: {ROWS.length} rows, searched in
          your browser. Nothing is uploaded and nothing asks you to sign up.
        </p>
      </PageIntro>

      <Container className="mt-10">
        <FadeIn>
          <Checker featured={FEATURED.map((r) => r.slug)} verdictLines={VERDICT_LINE} />
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade pt-10">
            <h2 className="font-display text-2xl font-medium text-white">The rule behind every verdict</h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">{META.evidence_rule}</p>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              See every row at once on{' '}
              <Link href="/really-european" className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                the full audit
              </Link>
              , or the DORA cut on{' '}
              <Link href="/dora/providers" className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                ICT providers for the register of information
              </Link>
              .
            </p>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rule-fade pt-10">
            <Faq items={FAQ} />
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
