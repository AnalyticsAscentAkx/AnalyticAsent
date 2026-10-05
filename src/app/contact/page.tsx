'use client'


import { useEffect, useId, useState } from 'react'
import Link from 'next/link'

import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SocialMedia } from '@/components/SocialMedia'
import { RootLayout } from '@/components/RootLayout'
import { CONTACT_EMAIL } from '@/lib/site'
import { track } from '@/lib/track'

function Field({
  label,
  textarea,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string; textarea?: boolean }) {
  let id = useId()
  let shared =
    'peer block w-full border border-[var(--line-bright)] bg-transparent px-6 pt-12 pb-4 text-base/6 text-white ring-4 ring-transparent transition group-first:rounded-t-2xl group-last:rounded-b-2xl focus:border-[var(--blue)] focus:ring-[var(--blue)]/10 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      {textarea ? (
        <textarea
          id={id}
          rows={5}
          {...(props as React.ComponentPropsWithoutRef<'textarea'>)}
          placeholder=" "
          className={`${shared} resize-y`}
        />
      ) : (
        <input type="text" id={id} {...props} placeholder=" " className={shared} />
      )}
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-6 origin-left text-base/6 text-[var(--text-faint)] transition-all duration-200 peer-not-placeholder-shown:-translate-y-4 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-white peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-white ${
          textarea ? 'top-10 -mt-3' : 'top-1/2 -mt-3'
        }`}
      >
        {label}
      </label>
    </div>
  )
}

/** Build the mailto a visitor can use if sending fails or is unavailable. The
 *  message is never lost to a failed request — it is already typed, so hand it
 *  to their mail client with every field filled in. */
function mailtoFor(d: { name: string; email: string; company: string; message: string }, topic: string) {
  const body = [
    `Name: ${d.name}`,
    `Email: ${d.email}`,
    d.company ? `Company: ${d.company}` : '',
    '',
    d.message,
  ]
    .filter(Boolean)
    .join('\n')
  const subject = topic
    ? `Enquiry from analyticascent.com — ${topic}`
    : 'Enquiry from analyticascent.com'
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
    website: '', // honeypot
  })
  const [topic, setTopic] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [handedOff, setHandedOff] = useState(false)
  const [error, setError] = useState<React.ReactNode | null>(null)

  // The CTAs around the site link to /contact?subject=Financial%20modelling and
  // the like. Carrying that through means the enquiry arrives already labelled
  // with what it is about. Read from the URL directly rather than through
  // useSearchParams, which would force this page out of static rendering.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('subject')
    if (s) setTopic(s.slice(0, 120))
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const fallback = (lead: string) => {
    const href = mailtoFor(formData, topic)
    setError(
      <>
        {lead}{' '}
        <a href={href} className="font-semibold text-white underline">
          Send it by email instead
        </a>{' '}
        — your message is already filled in, or write to {CONTACT_EMAIL}.
      </>,
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    // The one page that turns a visitor into work was the only one reporting
    // nothing, so there was no way to tell "nobody enquired" from "the form is
    // broken" — which it was.
    track('contact_submit', { topic: topic || 'none' })

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, subject: topic }),
      })
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        code?: string
        message?: string
      }

      if (response.ok && result.ok) {
        track('contact_delivered', { topic: topic || 'none' })
        setSubmitted(true)
        setFormData({ name: '', email: '', company: '', message: '', website: '' })
        return
      }

      // A validation complaint is the visitor's to fix, so show it as written.
      if (response.status === 400 && result.message) {
        track('contact_rejected', { reason: result.message })
        setError(result.message)
        return
      }

      // No delivery route configured yet. That is our problem, not something to
      // show a visitor as an error — hand the typed message to their mail
      // client with every field already in it.
      if (result.code === 'not-configured') {
        track('contact_mailto_handoff', { topic: topic || 'none' })
        window.location.href = mailtoFor(formData, topic)
        setHandedOff(true)
        return
      }

      track('contact_failed', { code: result.code ?? String(response.status) })
      fallback('That did not send.')
    } catch {
      track('contact_failed', { code: 'network' })
      fallback('That did not send — the network request failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (handedOff) {
    return (
      <FadeIn className="lg:order-last">
        <div className="rounded-2xl border border-[var(--line-bright)] bg-[var(--bg-card)] p-8">
          <h2 className="font-display text-xl font-semibold text-white">
            Your mail client should have opened.
          </h2>
          <p className="mt-4 text-[var(--text-dim)]">
            Everything you typed is already in the draft — press send there. If nothing opened,
            write to{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-[var(--blue-light)] hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      </FadeIn>
    )
  }

  if (submitted) {
    return (
      <FadeIn className="lg:order-last">
        <div className="rounded-2xl border border-[var(--line-bright)] bg-[var(--bg-card)] p-8">
          <h2 className="font-display text-xl font-semibold text-white">
            That is with us.
          </h2>
          <p className="mt-4 text-[var(--text-dim)]">
            It goes to the person who would do the work, not a queue. Expect a reply within two
            working days — usually with a question before any proposal.
          </p>
          <p className="mt-6 text-sm text-[var(--text-dim)]">
            Meanwhile, every{' '}
            <Link href="/tools" className="font-semibold text-[var(--blue-light)] hover:text-white">
              tool here
            </Link>{' '}
            runs in your own browser and uploads nothing, so you can try one on your own file.
          </p>
        </div>
      </FadeIn>
    )
  }

  return (
    <FadeIn className="lg:order-last">
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="font-display text-base font-semibold text-white">
          Get in touch
        </h2>

        {topic && (
          <p className="mt-4 text-sm text-[var(--text-dim)]">
            About <span className="text-white">{topic}</span>.
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-4"
          >
            <p className="text-sm leading-6 text-[#fcd34d]">{error}</p>
          </div>
        )}

        <div className="isolate mt-6 -space-y-px rounded-2xl bg-[var(--bg)]/50">
          <Field
            label="Name"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <Field
            label="Company"
            name="company"
            autoComplete="organization"
            value={formData.company}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <Field
            label="What are you trying to work out?"
            name="message"
            textarea
            value={formData.message}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Not shown to people, not announced to screen readers, and not
            autofilled. Anything that arrives in it came from a bot. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={handleChange}
          />
        </div>

        <Button type="submit" className="mt-10" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send'}
        </Button>
        <p className="mt-4 text-xs text-[var(--text-faint)]">
          What you send is used to answer you and nothing else.
        </p>
      </form>
    </FadeIn>
  )
}

function ContactDetails() {
  return (
    <FadeIn>
      <h2 className="font-display text-base font-semibold text-white">Direct</h2>
      <p className="mt-6 text-base text-[var(--text-dim)]">
        Email is read by the person who would do the work. A reply within two working days, usually with a question before any proposal.
      </p>

      <Border className="mt-16 pt-16">
        <h2 className="font-display text-base font-semibold text-white">
          Email
        </h2>
        <dl className="mt-6 grid grid-cols-1 gap-8 text-sm">
          <div>
            <dt className="font-semibold text-white">General Inquiries</dt>
            <dd>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[var(--text-dim)] hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            </dd>
          </div>
        </dl>
      </Border>

      <Border className="mt-16 pt-16">
        <h2 className="font-display text-base font-semibold text-white">
          Follow Us
        </h2>
        <SocialMedia className="mt-6" />
      </Border>
    </FadeIn>
  )
}

export default function Contact() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Contact" title="Bring the messy version">
        <p>
          The useful problems arrive as a spreadsheet nobody trusts and a question somebody needs
          answered on Thursday. That is the normal starting point, not a reason to wait until the
          data is tidy.
        </p>
      </PageIntro>

      <Container className="mt-16">
        <FadeIn>
          <div className="grid gap-x-10 gap-y-8 border-t border-[var(--line)] pt-10 sm:grid-cols-3">
            {[
              [
                'What is worth sending',
                'The real extract rather than a tidied sample, and the question you actually need answered. A sentence about what goes wrong today is worth more than a specification.',
              ],
              [
                'What happens next',
                'A reply within two working days, and usually a question or two before any proposal. If it is not something we would do well, we will say so and point elsewhere.',
              ],
              [
                'If you would rather not send data',
                'Every tool here runs in your own browser and uploads nothing, so you can try one on your file first and tell us what came back.',
              ],
            ].map(([t, b]) => (
              <div key={t} className="border-t border-[var(--line)] pt-4">
                <h2 className="font-display font-semibold text-white">{t}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{b}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-x-8 gap-y-24 lg:grid-cols-2">
          <ContactForm />
          <ContactDetails />
        </div>
      </Container>
    </RootLayout>
  )
}
