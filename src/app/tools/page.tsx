import { type Metadata } from 'next'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'

export const metadata: Metadata = {
  title: 'Free browser tools for operations data',
  description:
    'Five free tools, no upload: a DORA register of information checker, unit economics calculator, should-cost part matcher, data cleaning tool and company ownership dataset.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Five working tools, free and in your browser',
    description: 'Five free tools, no upload: a DORA register of information checker, unit economics calculator, should-cost part matcher, data cleaning tool and company ownership dataset.',
    url: '/tools',
    images: ['/opengraph-image'],
  },
}

const TOOLS = [
  {
    href: '/dora-register',
    name: 'DORA Register Checker',
    line: 'Find out whether the supervisor will reject it, before they do.',
    body:
      'Drop in a Register of Information — the zip, the fifteen CSVs or the workbook — and it runs the EBA\u2019s own rule set: package checks, keys and foreign keys, closed lists, business rules, LEI check digits. Then it reads the register back to you: where the concentration sits, which providers are designated critical, where the data rests.',
    stats: [
      ['15', 'templates'],
      ['22', 'foreign keys'],
      ['0', 'rows uploaded'],
    ],
  },
  {
    href: '/unit-economics',
    name: 'Unit Economics Calculator',
    line: 'Find the assumption your business case turns on.',
    body:
      'Contribution margin, break-even volume and margin of safety, then the part that matters: a sensitivity pass that ranks your inputs by how much each one moves the answer. Plus a demand forecast with an interval that widens honestly.',
    stats: [
      ['3', 'worked presets'],
      ['±5–30%', 'sensitivity range'],
      ['6', 'periods forecast'],
    ],
  },
  {
    href: '/cm-optimiser',
    name: 'Quote Matcher',
    line: 'Price a part from ones you have already quoted.',
    body:
      'Give it a part and it finds the closest things in a quote history, anchors a price to them, and refuses to answer when nothing is close enough to be worth trusting. Drop in your own history and it matches against that instead.',
    stats: [
      ['95.0%', 'recall at ten'],
      ['±36.5%', 'median price error'],
      ['4,000', 'sample quotes'],
    ],
  },
  {
    href: '/data-clinic',
    name: 'Data Clinic',
    line: 'Find out what is actually wrong with a spreadsheet.',
    body:
      'Duplicate rows, units inside the values, two decimal conventions in one column, dates in two orders, the same value spelled three ways. It names each one, says why it costs you, and hands back a cleaned copy.',
    stats: [
      ['8', 'classes of problem'],
      ['0', 'rows uploaded'],
      ['CSV', 'or Excel'],
    ],
  },
  {
    href: '/datasets/who-owns-what',
    name: 'Who Owns What',
    line: 'Corporate structure, joined from public registers.',
    body:
      'Type a company name and get the legal entities behind it, the parents they report, and the research funding they have received. Built from registers that share no identifier, published with its error cases.',
    stats: [
      ['3,317', 'legal entities'],
      ['0.970', 'precision'],
      ['Free', 'to download'],
    ],
  },
]

export default function Tools() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free browser tools for operations data',
    itemListElement: TOOLS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://analyticascent.com${t.href}`,
      name: t.name,
      description: t.line,
    })),
  }
  return (
    <RootLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <PageIntro eyebrow="Tools" title="Working tools, not screenshots">
        <p>
          Five things that run right now, in your browser, on your own data if you want. Nothing
          is uploaded and there is nothing to sign up for — the matching happens on your machine,
          which is the only version of this a company with confidential data can actually use.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <div className="space-y-8">
          {TOOLS.map((t) => (
            <FadeIn key={t.href}>
              <Link
                href={t.href}
                className="group block rounded-3xl border border-[var(--line)] bg-[var(--bg-card)] p-8 transition hover:border-[var(--blue)]/50 sm:p-10"
              >
                <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-8">
                    <h2 className="font-display text-2xl font-medium tracking-tight text-white transition group-hover:text-[var(--blue-light)]">
                      {t.name}
                    </h2>
                    <p className="mt-2 text-lg text-[var(--blue-light)]">{t.line}</p>
                    <p className="mt-4 max-w-2xl text-[var(--text-dim)]">{t.body}</p>
                  </div>
                  <dl className="grid grid-cols-3 gap-4 lg:col-span-4">
                    {t.stats.map(([v, l]) => (
                      <div key={l} className="border-t border-[var(--line-bright)] pt-3">
                        <dd className="font-display text-xl font-medium text-white tabular-nums">
                          {v}
                        </dd>
                        <dt className="mt-1 text-xs leading-4 text-[var(--text-faint)]">{l}</dt>
                      </div>
                    ))}
                  </dl>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <h2 className="font-display text-2xl font-medium text-white">
              Why these run in the browser
            </h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              A demo that needs your data on someone else&apos;s server is a demo most companies
              are not allowed to try. Quote histories, part lists and customer files are the most
              commercially sensitive things a business owns, and the approvals to send one
              somewhere take longer than the evaluation would. So these do the work locally: the
              page loads once, and after that nothing leaves the tab. Closing it is the deletion
              step.
            </p>
          </div>
        </FadeIn>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
