import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { CONTACT_EMAIL } from '@/lib/site'

// Where Stripe sends people after they pay. Set as the confirmation page on
// each Payment Link. Not for search engines: it means nothing without the
// checkout that precedes it.
export const metadata: Metadata = {
  title: 'Thank you',
  robots: { index: false, follow: false },
}

export default function Thanks() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Payment received" title="Thank you. Here is what happens next.">
        <p>
          Stripe has sent a receipt to the address you gave at checkout. We have the same notice and will
          write to you within one working day from {CONTACT_EMAIL} to arrange the hand-over of the
          register.
        </p>
      </PageIntro>
      <Container className="mt-12 sm:mt-16">
        <FadeIn>
          <ol className="max-w-2xl space-y-5 text-[var(--text-dim)]">
            {[
              ['Run the free check first, if you have not already.', 'Download the report and the detailed-feedback.csv; they are the first thing we will ask for.'],
              ['Get the register to us.', 'A password-protected zip by email, or a share from your own file store. We confirm receipt and the start of the clock.'],
              ['We work, you get the report and a call.', 'Three working days for a single entity, five for a group. Remediation is scoped after the first look.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="stat font-display text-2xl font-medium">{i + 1}</span>
                <span>
                  <span className="block text-white">{t}</span>
                  <span className="text-sm">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/dora-register">Open the checker</Button>
            <Link href="/" className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]">
              Back to the site
            </Link>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
