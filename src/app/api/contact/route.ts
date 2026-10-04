import { CONTACT_EMAIL } from '@/lib/site'

// Where a contact form submission actually goes.
//
// Runs at the edge on Cloudflare Pages, so the delivery credential stays on
// the server and the Google endpoint is never exposed to a page that anyone
// can read. It also means the browser posts same-origin and there is no CORS
// negotiation to go wrong.
//
// Two delivery routes, whichever is configured:
//   CONTACT_WEBHOOK_URL — a Google Apps Script web app that mails the enquiry
//                         and appends a row to a Sheet. No key, no spend.
//   RESEND_API_KEY      — a transactional email provider, as a second option.
//
// With neither set the route says so with a 503 and a machine-readable code,
// which is the client's cue to fall back to opening a mail client. A form that
// silently accepts a message it cannot deliver is worse than no form.

export const runtime = 'edge'

const MAX = { name: 120, email: 200, company: 160, message: 5000 }

interface Payload {
  name?: string
  email?: string
  company?: string
  message?: string
  subject?: string
  /** Honeypot. Real people cannot fill a field they cannot see. */
  website?: string
}

const bad = (message: string, status = 400, code = 'invalid') =>
  Response.json({ ok: false, code, message }, { status })

export async function POST(request: Request) {
  let body: Payload
  try {
    body = (await request.json()) as Payload
  } catch {
    return bad('Could not read that submission.')
  }

  // Bots fill every field they find, including the one hidden from people.
  // Answer 200 so the sender learns nothing from the difference.
  if (body.website) return Response.json({ ok: true })

  const name = (body.name ?? '').trim().slice(0, MAX.name)
  const email = (body.email ?? '').trim().slice(0, MAX.email)
  const company = (body.company ?? '').trim().slice(0, MAX.company)
  const message = (body.message ?? '').trim().slice(0, MAX.message)
  const subject = (body.subject ?? '').trim().slice(0, 120)

  if (!name) return bad('A name is needed so we know who is writing.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return bad('That email address does not look right.')
  if (message.length < 10)
    return bad('Tell us a little more — a sentence about the problem is enough.')

  const heading = subject
    ? `Enquiry from analyticascent.com — ${subject}`
    : 'Enquiry from analyticascent.com'
  const text = [
    `Name:    ${name}`,
    `Email:   ${email}`,
    company ? `Company: ${company}` : null,
    subject ? `Topic:   ${subject}` : null,
    `Page:    ${request.headers.get('referer') ?? '(unknown)'}`,
    '',
    message,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const env = process.env
  const webhook = env.CONTACT_WEBHOOK_URL
  const resendKey = env.RESEND_API_KEY

  try {
    if (webhook) {
      const r = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: env.CONTACT_WEBHOOK_TOKEN ?? '',
          to: CONTACT_EMAIL,
          subject: heading,
          name,
          email,
          company,
          topic: subject,
          message,
          text,
          receivedAt: new Date().toISOString(),
        }),
      })
      // Apps Script answers 302 to its own usercontent host on success, which
      // fetch follows; anything that is not a 2xx by the end is a real failure.
      if (!r.ok) throw new Error(`webhook responded ${r.status}`)
      return Response.json({ ok: true })
    }

    if (resendKey) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.RESEND_FROM ?? `Analytics Ascent <onboarding@resend.dev>`,
          to: [CONTACT_EMAIL],
          reply_to: email,
          subject: heading,
          text,
        }),
      })
      if (!r.ok) throw new Error(`resend responded ${r.status}`)
      return Response.json({ ok: true })
    }
  } catch (e) {
    console.error('contact delivery failed:', e)
    return bad(
      'The message could not be delivered just now.',
      502,
      'delivery-failed',
    )
  }

  return bad('No delivery route is configured.', 503, 'not-configured')
}
