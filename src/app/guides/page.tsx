import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { GUIDES, guidePath } from '@/lib/guides'
import { SITE_URL, pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'DORA Register of Information guides',
  ogTitle: 'Guides to the DORA Register of Information, sourced to the regulators',
  description:
    'Answers to the questions a DORA Register of Information raises: rejection errors 805, 806 and 807, deadlines by NCA, LEI or EUID, and what each template holds.',
  path: '/guides',
  keywords: [
    'DORA register of information guide',
    'DORA register of information rejected',
    'DORA register of information deadline',
    'DORA register of information templates',
    'LEI vs EUID',
  ],
})

export default function Guides() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'DORA Register of Information guides',
    itemListElement: GUIDES.map((g, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}${guidePath(g.slug)}`,
      name: g.title,
      description: g.line,
    })),
  }
  return (
    <RootLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
        ]}
      />
      <PageIntro eyebrow="Guides" title="One question per page, answered from the source">
        <p>
          Each guide takes one question people get stuck on and answers it completely. Every rule,
          date and code is taken from the regulator&apos;s own document, which the guide names, links
          and dates. Where a fact could not be checked against a primary source, it is not on the page.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <div className="space-y-8">
          {GUIDES.map((g) => (
            <FadeIn key={g.slug}>
              <Link
                href={guidePath(g.slug)}
                className="group block rounded-3xl border border-[var(--line)] bg-[var(--bg-card)] p-8 transition hover:border-[var(--blue)]/50 sm:p-10"
              >
                <p className="text-sm font-semibold text-[var(--text-faint)]">DORA Register of Information</p>
                <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-white transition group-hover:text-[var(--blue-light)]">
                  {g.title}
                </h2>
                <p className="mt-4 max-w-3xl text-[var(--text-dim)]">{g.line}</p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">Check your own register</h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              The guides explain the rules; the{' '}
              <Link href="/dora-register" className="text-[var(--blue-light)] hover:underline">
                DORA Register Checker
              </Link>{' '}
              runs them on your file, in your browser, with nothing uploaded. If the register needs more
              than a check, the{' '}
              <Link href="/dora-services" className="text-[var(--blue-light)] hover:underline">
                fixed-price services
              </Link>{' '}
              are listed with their prices.
            </p>
          </div>
        </FadeIn>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
