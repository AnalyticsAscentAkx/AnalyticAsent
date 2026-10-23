import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs, Faq } from '@/components/Faq'
import { RootLayout } from '@/components/RootLayout'
import { SoftwareStructuredData } from '@/components/StructuredData'
import {
  SYNTHETIC_DEFAULT_SEED,
  analyse,
  generateSynthetic,
  parseCSV,
  parseShopifyOrders,
  parseUps,
} from '@/lib/afterlabel/engine'
import { OFFER_LINE, PLANS } from '@/lib/afterlabel/pricing'
import { CONTACT_EMAIL, pageMetadata } from '@/lib/site'

import { RouteField } from './RouteField'
import { SampleReadout } from './SampleReadout'
import { Tool } from './Tool'
import { JoinLink, PlanButton, PricingViewTracker, WaitlistDialog, WaitlistProvider } from './Waitlist'

export const metadata = pageMetadata({
  title: 'UPS invoice checker: what UPS really charged per order',
  ogTitle: 'Afterlabel: see what UPS really charged you, order by order',
  description:
    'Upload a UPS invoice CSV and a Shopify orders export and see what UPS really charged per order, including the surcharges and corrections added after the label. Free, runs in your browser, nothing uploaded.',
  path: '/afterlabel',
  image: '/afterlabel/opengraph-image',
  keywords: [
    'UPS invoice',
    'UPS shipping charge correction',
    'UPS residential surcharge',
    'UPS billing center csv',
    'shipping cost per order shopify',
    'UPS invoice audit',
  ],
})

// The hero's figures: the sample report, run at build time through the same engine and seed as the
// "Run the sample" button, so the readout and the report it opens agree by construction.
const d = generateSynthetic({ seed: SYNTHETIC_DEFAULT_SEED })
const sample = analyse(parseUps(parseCSV(d.ups)).lines, { shop: parseShopifyOrders(parseCSV(d.shop)) })

const SEE = [
  [
    'Charges added after the label',
    'The corrections UPS billed once the box was measured: weight and size corrections, address fixes, and the category UPS itself marks as an adjustment.',
  ],
  [
    'Orders and products losing money on shipping',
    'What the customer paid at checkout against what UPS billed for every package on the order, then the same split per product.',
  ],
  [
    'Boxes billed heavier than you entered',
    'Packages where the billed weight is well above the label weight, which is what dimensional pricing looks like on an invoice, and what a different box would avoid.',
  ],
]

const APP_POINTS = [
  'Works with any label tool or 3PL, because it reads the invoice rather than the labels.',
  'Recipient names and addresses are dropped as the file is read; the app keeps only what the report needs.',
  'Manual upload stays as the fallback, exactly like this page.',
]

const FAQ = [
  {
    q: 'Why is my UPS bill higher than the label price?',
    a: 'The label price covers the base rate at the time you shipped. UPS adds the rest when it processes the package and again when it audits it: fuel, residential and delivery-area surcharges, additional handling, address corrections, and shipping charge corrections where the measured weight or size was above what was entered. Those lines appear only on the invoice, usually one to two weeks later, which is why the label tool and the bill disagree.',
  },
  {
    q: 'Which UPS file do I need?',
    a: 'The billing data CSV from UPS Billing Center. Open an invoice or a date range, download as CSV, and drop the file in. UPS ships this file with or without a header row and in a 250-column layout that grows to 270 columns from September 2026; all of these are read, and a column mapper is there for anything unusual.',
  },
  {
    q: 'Does this work if a 3PL ships for me?',
    a: 'Yes, and that is the case it was built for. Tools that work from label data cannot see shipments a 3PL made on your UPS account; the invoice can. If the 3PL puts your order number in the UPS reference field the orders match directly. If it does not, add their shipments export so tracking numbers can be tied to orders.',
  },
  {
    q: 'Is anything uploaded?',
    a: 'No. The files are read in your browser tab and the matching runs there. The only request this page makes is the waitlist form, if you choose to join it, and that carries your email, the plan and parcel range you pick, your store URL if you add one, and five summary figures from your report. Never the files.',
  },
  {
    q: 'Can an app read my UPS charges directly from UPS?',
    a: 'Not today. UPS publishes APIs for shipping, rating, tracking, address validation, pickups, locations and transit times. None of them returns invoice lines, surcharges or corrections; those exist only in UPS Billing Center as the invoice itself, downloadable as PDF, CSV or XML. The app therefore works from the invoice file: you forward it to a private address and the report runs on it.',
  },
  {
    q: 'What will the Shopify app cost?',
    a: 'The planned prices are $19 a month for up to 500 shipments, $39 for up to 2,000 and $79 above that, billed through Shopify, each starting with 30 days free. People who join the list before launch get their first three months at half price. Nothing is on sale yet and nothing is charged for joining the list.',
  },
]

export default function Afterlabel() {
  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Tools', path: '/tools' },
          { name: 'Afterlabel', path: '/afterlabel' },
        ]}
      />
      <SoftwareStructuredData
        name="Afterlabel"
        description="Tie a UPS invoice CSV to Shopify orders and see the charges added after the label. Runs entirely in the browser; nothing is uploaded."
        path="/afterlabel"
      />
      <WaitlistProvider contact={CONTACT_EMAIL}>
        <div className="relative isolate overflow-hidden">
          <RouteField />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_20%_50%,rgba(7,11,22,0.96),rgba(7,11,22,0.6)_60%,transparent)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--bg)]"
          />
          <Container className="relative pt-24 pb-16 sm:pt-32 lg:pt-40">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <FadeIn className="lg:col-span-7">
                <p className="font-display text-base font-semibold text-white">Free, in your browser</p>
                <h1 className="mt-6 max-w-4xl font-display text-5xl font-medium tracking-tight text-balance text-white sm:text-6xl">
                  See what UPS really charged you, order by order.
                </h1>
                <p className="mt-6 max-w-2xl text-xl text-[var(--text-dim)]">
                  The label price is not the shipping cost. Fuel, residential and delivery-area
                  surcharges, weight corrections and address fixes arrive on the invoice weeks later.
                  Drop in the UPS invoice and your Shopify orders export and we tie every charge line
                  to the order it belongs to.
                </p>
                <p className="mt-6 text-sm text-[var(--text-dim)]">
                  Files are read in this tab and never uploaded. Closing the tab is the deletion step.
                </p>
              </FadeIn>
              <div className="lg:col-span-5 lg:flex lg:justify-end">
                <SampleReadout
                  adjustments={sample.totals.adjustments}
                  adjustmentShare={sample.totals.adjustmentShare}
                  matchRate={sample.matchRate}
                  ordersLosing={sample.shipping.ordersLosing}
                  ordersWithCharge={sample.shipping.ordersWithCharge}
                />
              </div>
            </div>
          </Container>
        </div>

        <Container className="mt-16 sm:mt-20">
          <Tool sampleSeed={SYNTHETIC_DEFAULT_SEED} />
        </Container>

        <Container className="mt-24 sm:mt-32">
          <FadeIn>
            <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
              What you will see
            </h2>
            <div className="mt-10 grid gap-10 sm:grid-cols-3">
              {SEE.map(([title, body]) => (
                <div key={title} className="rule-fade pt-6">
                  <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 leading-7 text-[var(--text-dim)]">{body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 max-w-3xl text-[var(--text-dim)]">
              For stores shipping on their own UPS account through ShipStation, a 3PL or any label
              tool. If Shopify prints your labels, Shopify&apos;s own reports already show most of this.
            </p>
          </FadeIn>
        </Container>

        <div className="section-lift mt-24 py-20 sm:mt-32 sm:py-28">
          <Container>
            <FadeIn>
              <div className="grid gap-12 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <p className="font-display text-base font-semibold text-[var(--blue-light)]">
                    Afterlabel for Shopify, being built
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-balance text-white sm:text-4xl">
                    The same report every week, written back into Shopify
                  </h2>
                  <p className="mt-6 text-lg text-[var(--text-dim)]">
                    The checker above is a one-off. The app does the same work on every invoice as it
                    arrives: each order gets its true UPS cost and its corrections as fields on the
                    order, orders with corrections get a tag, and you get a weekly summary with a list
                    of charges that look wrong enough to dispute.
                  </p>
                </div>
                <div className="lg:col-span-6">
                  <h3 className="font-display text-xl font-semibold text-white">How the invoice reaches the app</h3>
                  <p className="mt-4 text-[var(--text-dim)]">
                    UPS does not offer an API for invoice data. Its developer APIs cover shipping,
                    rating, tracking, address checks, pickups and transit times. Billed weight,
                    surcharges and corrections exist only on the invoice in UPS Billing Center, so
                    there is nothing for an app to connect to and nothing we can read from UPS directly.
                  </p>
                  <p className="mt-4 text-[var(--text-dim)]">
                    The app works from the invoice file itself. Your store gets a private Afterlabel
                    address. Forward the UPS invoice email, or the CSV you download from Billing Center,
                    to that address and the report runs on it. If UPS already emails invoices to your
                    account, a forwarding rule in your mail client makes it hands-off. No UPS password
                    is shared, and nothing is installed in your warehouse.
                  </p>
                  <ul role="list" className="mt-6 space-y-3 text-[var(--text)]">
                    {APP_POINTS.map((c) => (
                      <li key={c} className="flex gap-3">
                        <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-[var(--blue)]" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          </Container>
        </div>

        <Container className="mt-24 sm:mt-32">
          <PricingViewTracker>
            <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-24">
              <h2 id="pricing-h" className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
                Planned prices
              </h2>
              <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
                The checker stays free. These are the planned prices for the Shopify app, billed
                through Shopify. Every plan starts with 30 days free.
              </p>
              <p className="mt-4 text-lg text-white">{OFFER_LINE}</p>
              <ol role="list" className="mt-12 grid gap-10 sm:grid-cols-3">
                {PLANS.map((p) => (
                  <li key={p.id} className="rule-fade pt-6">
                    <h3 className="font-display text-lg font-semibold text-white">{p.name}</h3>
                    <p className="mt-4">
                      <span className="stat font-display text-5xl font-medium">${p.price}</span>
                      <span className="ml-2 text-sm text-[var(--text-dim)]">per month</span>
                    </p>
                    <p className="mt-2 text-[var(--text-dim)]">{p.limit}</p>
                    <PlanButton id={p.id} name={p.name} />
                  </li>
                ))}
              </ol>
              <p className="mt-10 max-w-3xl text-sm text-[var(--text-faint)]">
                Nothing is on sale yet. Subscribe adds you to the list: no card is asked and nothing is
                charged. <JoinLink>Join the list</JoinLink> without picking a plan.
              </p>
            </section>
          </PricingViewTracker>
        </Container>

        <Container className="mt-20 sm:mt-28">
          <FadeIn>
            <div className="border-t border-[var(--line)] pt-10">
              <Faq items={FAQ} />
            </div>
          </FadeIn>
        </Container>

        <ContactSection />
        <WaitlistDialog />
      </WaitlistProvider>
    </RootLayout>
  )
}
