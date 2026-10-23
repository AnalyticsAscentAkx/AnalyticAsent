import Link from 'next/link'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { CONTACT_EMAIL, pageMetadata } from '@/lib/site'

// What the site collects, written against the code: the consent defaults in components/Analytics.tsx, the two
// GLEIF lookups, /api/contact, /api/count and the Apps Script in scripts/contact-endpoint.gs. When any of those
// change, this page changes with them and the date moves.
export const metadata = pageMetadata({
  title: 'Privacy notice',
  description:
    'What analyticascent.com and its browser tools collect, where it goes, how long we keep it and how to ask us to delete it.',
  path: '/privacy',
})

const UPDATED = '23 October 2026'

const a = 'text-[var(--blue-light)] hover:underline'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--line)] pt-8">
      <h2 className="font-display text-2xl font-medium text-white">{title}</h2>
      <div className="mt-6 max-w-3xl space-y-5 leading-7 text-[var(--text-dim)]">{children}</div>
    </section>
  )
}

export default function Privacy() {
  const mail = (
    <a href={`mailto:${CONTACT_EMAIL}`} className={a}>
      {CONTACT_EMAIL}
    </a>
  )
  return (
    <RootLayout>
      <PageIntro eyebrow="Privacy" title="Privacy notice">
        <p>
          This notice covers analyticascent.com and the browser tools on it. Last updated {UPDATED}.
        </p>
      </PageIntro>

      <Container className="mt-12 sm:mt-16">
        <FadeIn className="space-y-16">
          <Section title="Who we are">
            <p>
              Analytics Ascent, a business registered in the Netherlands with the Chamber of Commerce (KVK) under
              number 98253980. We are the controller for the personal data described here. Contact: {mail}.
            </p>
          </Section>

          <Section title="Hosting">
            <p>
              The site is served by Cloudflare Pages. Cloudflare processes your IP address and request details in its
              server logs to deliver the pages and to block abuse. Cloudflare also obscures the email addresses on our
              pages from scrapers. Our contact and counting endpoints run on Cloudflare&apos;s edge, so form
              submissions and counts pass through Cloudflare before reaching us.
            </p>
          </Section>

          <Section title="Analytics">
            <p>
              We use Google Analytics 4 with Consent Mode. Analytics storage is denied by default; advertising
              storage, ad user data and ad personalisation are always denied. The site runs no ads.
            </p>
            <p>
              If you click Accept on the banner, Google Analytics sets its cookies and we see page views, tool usage
              events and rough location. Your choice is kept in your browser under the key aa-consent, so the banner
              does not return.
            </p>
            <p>
              If you click Decline, no analytics cookies are set and your choice is kept the same way. Under Consent
              Mode the Google library still sends cookieless pings (page and event, no identifier that persists
              between visits) to Google, which uses them for aggregate modelling. Google Analytics 4 does not log or
              store IP addresses, and we set the anonymise flag as well.
            </p>
            <p>
              Afterlabel also counts five events without cookies, whatever you chose on the banner: running the
              sample, running a real file, viewing the prices, clicking Subscribe on a plan and joining the waitlist.
              Your browser sends each one to our own endpoint at /api/count with three values only: the event name,
              the plan chosen (if the event has one) and the carrier picked on the waitlist form (if you picked one).
              The endpoint accepts only names and values from fixed lists, and passes on nothing about you: no IP
              address, browser details, cookie, identifier, page address or referrer. Each count becomes one row in a
              private Google Sheet holding the date (UTC), the event, the plan and the carrier. We keep these rows
              indefinitely; they contain no personal data.
            </p>
          </Section>

          <Section title="Browser tools">
            <p>
              Afterlabel, DORA Register Checker, Data Clinic, Quote Matcher, Unit Economics Calculator, Really
              European?, Who Owns What and the DORA ICT Provider Directory run in your browser. Files you choose are
              read and processed in the tab and are not uploaded to us. The tools fetch only their own reference data
              from this site.
            </p>
            <p>
              Two optional lookups leave your browser, both only when you start them, and neither passes through us:
            </p>
            <ul className="list-disc space-y-3 pl-6">
              <li>
                DORA Register Checker: the LEI codes found in your register, and nothing else, go to api.gleif.org in
                batches of up to 200.
              </li>
              <li>Really European?: the company name you type, and then a single LEI you pick, go to api.gleif.org.</li>
            </ul>
            <p>GLEIF publishes this data under CC0; its own privacy terms apply to those requests.</p>
          </Section>

          <Section title="Contact form and Afterlabel waitlist">
            <p>
              Both forms post to our /api/contact endpoint, which forwards them to a Google Apps Script web app under
              our Google account. The script emails us and appends a row to a private Google Sheet.
            </p>
            <p>
              Enquiries: name, email, company (optional), topic, message and the page you sent it from. Purpose:
              answer you. Lawful basis: our legitimate interest in responding, or steps before a contract when you
              ask about an engagement. Kept up to two years, or, if you become a client, as long as Dutch bookkeeping
              law requires (seven years).
            </p>
            <p>
              Afterlabel waitlist: email, store URL (optional), parcels per month (a band), the carrier you mainly
              ship with (one of UPS, FedEx, DHL, USPS or Other, or prefer not to say), the plan you chose, the offer
              shown, and, if you ran a report, five summary figures from it: UPS spend, share of spend added after
              the label, order count, count of orders that lost money, and match share. No order-level data.
              Purpose: tell you when the Shopify app opens and apply the founding offer. Lawful basis: your consent
              when you submit the form. Kept until 12 months after launch, or until you unsubscribe or ask us to
              delete it, whichever comes first. Every email to the list carries an unsubscribe line.
            </p>
            <p>If the endpoint is unavailable, the page offers to open your own mail client with the same text instead.</p>
          </Section>

          <Section title="Who receives data">
            <p>
              Cloudflare (hosting, edge, logs) and Google (Workspace, Apps Script, Sheets, Analytics). Both are US
              companies. Google and Cloudflare offer the EU-US Data Privacy Framework and standard contractual
              clauses for transfers outside the EEA.
            </p>
            <p>We do not sell data, run advertising cookies, or profile visitors.</p>
          </Section>

          <Section title="Your rights">
            <p>
              Under the GDPR you can ask for access, correction, deletion, restriction, objection or portability, and
              you can withdraw consent at any time. Email {mail} and we answer within one month. You can also
              complain to the Autoriteit Persoonsgegevens, the Dutch data protection authority, at{' '}
              <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className={a}>
                autoriteitpersoonsgegevens.nl
              </a>
              .
            </p>
          </Section>

          <Section title="Visitors in the United States">
            <p>
              The same practices apply. We do not sell or share personal information as those terms are defined in
              California law.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We update this page when the site changes and move the date at the top. Questions about any of it go to
              the same address, or through the{' '}
              <Link href="/contact" className={a}>
                contact form
              </Link>
              .
            </p>
          </Section>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
