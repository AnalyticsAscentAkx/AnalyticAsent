'use client'

import { useId, useState } from 'react'
import Link from 'next/link'

import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SocialMedia } from '@/components/SocialMedia'
import { RootLayout } from '@/components/RootLayout'

function TextInput({
  label,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  let id = useId()

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <input
        type="text"
        id={id}
        {...props}
        placeholder=" "
        className="peer block w-full border border-[var(--line-bright)] bg-transparent px-6 pt-12 pb-4 text-base/6 text-white ring-4 ring-transparent transition group-first:rounded-t-2xl group-last:rounded-b-2xl focus:border-[var(--line-bright)] focus:ring-white/15/5 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute top-1/2 left-6 -mt-3 origin-left text-base/6 text-[var(--text-faint)] transition-all duration-200 peer-not-placeholder-shown:-translate-y-4 peer-not-placeholder-shown:scale-75 peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-white peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-white"
      >
        {label}
      </label>
    </div>
  )
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', company: '', message: '' })
    } catch (err) {
      console.error('Error submitting contact form:', err)
      setError('Failed to send message. Please try again or email us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FadeIn className="lg:order-last">
      <form onSubmit={handleSubmit}>
        <h2 className="font-display text-base font-semibold text-white">
          Get in touch
        </h2>

        {submitted && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 border border-green-200">
            <p className="text-sm text-green-800">
              Thank you for your message! We&apos;ll get back to you soon.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="isolate mt-6 -space-y-px rounded-2xl bg-[var(--bg)]/50">
          <TextInput
            label="Name"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <TextInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <TextInput
            label="Company"
            name="company"
            autoComplete="organization"
            value={formData.company}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <TextInput
            label="Message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" className="mt-10" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Get in touch'}
        </Button>
      </form>
    </FadeIn>
  )
}

function ContactDetails() {
  return (
    <FadeIn>
      <h2 className="font-display text-base font-semibold text-white">
        Contact Information
      </h2>
      <p className="mt-6 text-base text-[var(--text-dim)]">
        Reach out to discuss how we can help transform your data into actionable insights.
      </p>

      <Border className="mt-16 pt-16">
        <h2 className="font-display text-base font-semibold text-white">
          Email
        </h2>
        <dl className="mt-6 grid grid-cols-1 gap-8 text-sm">
          <div>
            <dt className="font-semibold text-white">General Inquiries</dt>
            <dd>
              <Link
                href="mailto:craakash@analytic-ascent.com"
                className="text-[var(--text-dim)] hover:text-white"
              >
                craakash@analytic-ascent.com
              </Link>
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
