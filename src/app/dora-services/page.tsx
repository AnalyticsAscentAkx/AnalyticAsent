import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { eur, PACKAGES } from '@/lib/pricing'
import { pageMetadata, SITE_URL } from '@/lib/site'
import { BuyButton } from './BuyButton'

export const metadata = pageMetadata({
  title: 'DORA register of information services and pricing',
  ogTitle: 'DORA register services: pre-submission checks, remediation, concentration reporting',
  description:
    'Fixed-price help with the DORA Register of Information: a pre-submission check, register remediation, and a quarterly concentration report. Prices on the page.',
  path: '/dora-services',
  keywords: [
    'DORA register of information consulting',
    'DORA register of information help',
    'register of information remediation',
    'DORA ICT third party risk reporting',
    'DORA compliance services pricing',
  ],
})

const FAQ = [
  {
    q: 'How do you receive the register without it being uploaded?',
    a: 'You run it through the free checker first, in your browser, and send us the report and the detailed-feedback.csv it produces. For the check itself we then need the register: a password-protected zip to our address, or a share from your own file store with access revoked afterwards. We work on it on an encrypted machine, do not copy it anywhere else, and delete it at the end of the engagement, in writing.',
  },
  {
    q: 'Who does the work?',
    a: 'The same people who built the checker. Nothing is passed to a junior team or offshored. For a group register you will have one named person throughout.',
  },
  {
    q: 'Does a clean check mean the supervisor will accept the register?',
    a: 'It means the EBA rule set as published on 28 April 2025 finds nothing to reject, and that the things the ITS asks for but no rule enforces are in place. National portals can add checks of their own, and a supervisor can always ask a question about content. We say what the file will be found to contain; we do not promise an outcome.',
  },
  {
    q: 'What if we pay and then do not need the check?',
    a: 'Before any work has started, a full refund on request. Once the register has been received and work has begun, the fee stands, because the hours have been spent. The remediation deposit is set against the quoted fee and is refunded in full if you decline the quote.',
  },
  {
    q: 'Can we pay by invoice instead of card?',
    a: 'Yes. Use the contact form with the package named and we send an invoice with thirty-day terms. Work starts on payment either way.',
  },
  {
    q: 'Are prices inclusive of VAT?',
    a: 'No. Prices are in euros and exclude VAT, which is added at checkout or on the invoice according to where your entity is established.',
  },
]

export default function DoraServices() {
  const offers = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: PACKAGES.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: p.name,
        description: p.line,
        provider: { '@id': `${SITE_URL}/#organization` },
        offers: {
          '@type': 'Offer',
          price: p.price,
          priceCurrency: 'EUR',
          url: `${SITE_URL}/dora-services#${p.id}`,
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }
  return (
    <RootLayout>
      <Breadcrumbs trail={[{ name: 'Home', path: '/' }, { name: 'DORA Register Checker', path: '/dora-register' }, { name: 'Services and pricing', path: '/dora-services' }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offers) }} />
      <PageIntro eyebrow="DORA register of information" title="When the free check is not enough">
        <p>
          The checker tells you what the supervisor will find. These are the three things people ask for
          next: someone to read the findings with them, someone to fix the register, and someone to turn it
          into a board paper every quarter. Fixed prices, paid by card or invoice, work starts on payment.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {PACKAGES.map((p) => (
            <FadeIn key={p.id}>
              <article id={p.id} className="flex h-full flex-col rounded-3xl border border-[var(--line)] bg-[var(--bg-card)] p-8 sm:p-10">
                <h2 className="font-display text-2xl font-medium tracking-tight text-white">{p.name}</h2>
                <p className="mt-2 text-[var(--blue-light)]">{p.line}</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="stat font-display text-4xl font-medium">{eur(p.price)}</span>
                  <span className="text-sm text-[var(--text-faint)]">
                    {p.deposit ? 'deposit, set against the quote' : p.per === 'quarter' ? 'per quarter' : 'one-off'} · excl. VAT
                  </span>
                </p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-[var(--text-dim)]">
                  {p.scope.map((s) => (
                    <li key={s} className="flex gap-3">
                      <span aria-hidden="true" className="mt-3 h-px w-4 shrink-0 bg-[var(--blue)]" />
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-[var(--text-faint)]">{p.turnaround}</p>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <BuyButton pkg={p} />
                  <Link
                    href={`/contact?subject=${encodeURIComponent(p.subject)}`}
                    className="text-sm text-[var(--text-dim)] underline-offset-4 hover:text-white hover:underline"
                  >
                    Ask a question first
                  </Link>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-8 sm:p-12">
            <h2 className="font-display text-xl font-semibold text-white">Start with the free check</h2>
            <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
              Every engagement begins with the same step you can take yourself: run the register through{' '}
              <Link href="/dora-register" className="text-[var(--blue-light)] hover:underline">
                the checker
              </Link>{' '}
              in your browser and look at what comes back. If the findings are all things you can fix in an
              afternoon, you do not need us, and the page says so. If they are not, you already have the
              report that tells us where to start.
            </p>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-20 sm:mt-28">
        <FadeIn>
          <div className="border-t border-[var(--line)] pt-10">
            <Faq items={FAQ} title="Before you pay" />
          </div>
        </FadeIn>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
