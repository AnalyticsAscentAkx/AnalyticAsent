'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/Button'
import { PLANS } from '@/lib/afterlabel/pricing'
import {
  EMAIL_RE,
  PLAN_IDS,
  buildPayload,
  submitWaitlist,
  type Stats,
  type WaitlistPlan,
} from '@/lib/afterlabel/waitlist-client'
import { track } from '@/lib/track'

// The fake-door waitlist for the Afterlabel Shopify app. The notice that nothing is on sale comes first in the
// dialog, before any field. Plan and parcels leave only as members of the fixed lists (buildPayload); analytics
// gets those and the outcome, never the email, the store or the report figures.

type Source = 'plan' | 'link'

interface WaitlistApi {
  open: (source: Source, plan?: string) => void
  stats: Stats | null
  setStats: (s: Stats | null) => void
}

const WaitlistContext = createContext<WaitlistApi | null>(null)

export function useWaitlist(): WaitlistApi {
  const ctx = useContext(WaitlistContext)
  if (!ctx) throw new Error('useWaitlist outside WaitlistProvider')
  return ctx
}

interface Form {
  email: string
  store: string
  parcels: string
  plan: string
  website: string
}

const EMPTY: Form = { email: '', store: '', parcels: '', plan: 'undecided', website: '' }

type Done = null | 'sent' | 'mailto'

interface DialogState {
  form: Form
  error: string
  invalid: boolean
  sending: boolean
  done: Done
}

const INITIAL: DialogState = { form: EMPTY, error: '', invalid: false, sending: false, done: null }

const DialogStateContext = createContext<{
  ref: React.RefObject<HTMLDialogElement | null>
  state: DialogState
  setState: React.Dispatch<React.SetStateAction<DialogState>>
  contact: string
  close: () => void
  stats: Stats | null
} | null>(null)

const isPlan = (v: string): v is WaitlistPlan => (PLAN_IDS as readonly string[]).includes(v)

export function WaitlistProvider({ contact, children }: { contact: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [state, setState] = useState<DialogState>(INITIAL)

  const open = useCallback((source: Source, plan?: string) => {
    track('afterlabel_waitlist_open', { source })
    opener.current = document.activeElement as HTMLElement | null
    setState({ ...INITIAL, form: { ...EMPTY, plan: plan && isPlan(plan) ? plan : 'undecided' } })
    const d = ref.current
    if (!d) return
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
    // The email field is focused after the form state above has rendered.
    requestAnimationFrame(() => d.querySelector<HTMLInputElement>('#wl-email')?.focus())
  }, [])

  const close = useCallback(() => {
    const d = ref.current
    if (!d) return
    if (typeof d.close === 'function') d.close()
    else {
      d.removeAttribute('open')
      d.dispatchEvent(new Event('close'))
    }
  }, [])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onClose = () => {
      opener.current?.focus?.()
      opener.current = null
    }
    const onClick = (e: MouseEvent) => {
      if (e.target === d) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && typeof d.showModal !== 'function') close()
    }
    d.addEventListener('close', onClose)
    d.addEventListener('click', onClick)
    d.addEventListener('keydown', onKey)
    return () => {
      d.removeEventListener('close', onClose)
      d.removeEventListener('click', onClick)
      d.removeEventListener('keydown', onKey)
    }
  }, [close])

  const api = useMemo(() => ({ open, stats, setStats }), [open, stats])
  const dialog = useMemo(() => ({ ref, state, setState, contact, close, stats }), [state, contact, close, stats])

  return (
    <WaitlistContext.Provider value={api}>
      <DialogStateContext.Provider value={dialog}>{children}</DialogStateContext.Provider>
    </WaitlistContext.Provider>
  )
}

const input =
  'w-full rounded-lg border bg-[var(--bg-raised)] px-3 py-2 text-base text-white placeholder:text-[var(--text-faint)]'
const label = 'mt-4 block text-sm font-medium text-white'
export const pill =
  'inline-flex items-center rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]'

/** The dialog's markup as a pure function of its state, so the tests can render it without a browser. */
export function WaitlistDialogMarkup({
  state,
  contact,
  dialogRef,
  onChange,
  onSubmit,
  onClose,
}: {
  state: DialogState
  contact: string
  dialogRef?: React.Ref<HTMLDialogElement>
  onChange?: (field: keyof Form, value: string) => void
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  onClose?: () => void
}) {
  const { form, error, invalid, sending, done } = state
  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange?.(field, e.target.value)
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={done ? 'wl-done-h' : 'wl-h'}
      aria-describedby={done ? 'wl-done-msg' : 'wl-notice'}
      className="wl m-auto max-h-[calc(100dvh-32px)] w-[min(520px,calc(100%-32px))] overflow-auto rounded-2xl border border-[var(--line-bright)] bg-[var(--bg-card)] p-0 text-[var(--text)]"
    >
      <style>{'dialog.wl::backdrop{background:rgb(7 11 22 / 0.7)}'}</style>
      <div className="p-6">
        {done ? (
          <div role="status" tabIndex={-1} id="wl-done" className="outline-none">
            <h2 id="wl-done-h" className="font-display text-2xl font-medium text-white">
              {done === 'sent' ? 'You are on the list' : 'One more step'}
            </h2>
            <p id="wl-done-msg" className="mt-3 text-[var(--text-dim)]">
              {done === 'sent'
                ? 'We will email you when Afterlabel for Shopify opens, with the founding offer: your first 3 months at half price. Nothing has been charged.'
                : `Your email app should have opened with the message ready. Send it to finish joining the list. If nothing opened, write to ${contact} with your store and plan.`}
            </p>
            <div className="mt-6">
              <button type="button" className={pill} onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 id="wl-h" className="font-display text-2xl font-medium text-white">
              Join the Afterlabel list
            </h2>
            <p id="wl-notice" className="mt-3 border-b border-[var(--line)] pb-4 text-[var(--text-dim)]">
              Afterlabel for Shopify is being built and opens soon. No card is needed and nothing is
              charged. Join the list and we will email you when it is ready, with the founding offer:
              your first 3 months at half price.
            </p>
            <form noValidate onSubmit={onSubmit} className="mt-2">
              <label htmlFor="wl-email" className={label}>
                Email
              </label>
              <input
                id="wl-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                maxLength={200}
                value={form.email}
                onChange={set('email')}
                aria-invalid={invalid || undefined}
                aria-errormessage={invalid ? 'wl-err' : undefined}
                className={`${input} mt-1 ${invalid ? 'border-[var(--blue-light)]' : 'border-[var(--line-bright)]'}`}
              />
              <label htmlFor="wl-store" className={label}>
                Store URL <span className="font-normal text-[var(--text-faint)]">(optional)</span>
              </label>
              <input
                id="wl-store"
                name="store"
                type="text"
                autoComplete="url"
                inputMode="url"
                maxLength={200}
                placeholder="yourstore.myshopify.com"
                value={form.store}
                onChange={set('store')}
                className={`${input} mt-1 border-[var(--line-bright)]`}
              />
              <label htmlFor="wl-parcels" className={label}>
                Parcels per month
              </label>
              <select
                id="wl-parcels"
                name="parcels"
                value={form.parcels}
                onChange={set('parcels')}
                className={`${input} mt-1 border-[var(--line-bright)]`}
              >
                <option value="">Prefer not to say</option>
                <option value="under 300">Under 300</option>
                <option value="300 to 1,000">300 to 1,000</option>
                <option value="1,000 to 5,000">1,000 to 5,000</option>
                <option value="over 5,000">Over 5,000</option>
              </select>
              <label htmlFor="wl-plan" className={label}>
                Plan
              </label>
              <select
                id="wl-plan"
                name="plan"
                value={form.plan}
                onChange={set('plan')}
                className={`${input} mt-1 border-[var(--line-bright)]`}
              >
                <option value="undecided">Not sure yet</option>
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.option}
                  </option>
                ))}
              </select>
              <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
                <label htmlFor="wl-web">Leave this field empty</label>
                <input
                  id="wl-web"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={set('website')}
                />
              </div>
              {error ? (
                <p id="wl-err" role="alert" className="mt-4 text-sm text-white">
                  {error}
                </p>
              ) : null}
              <p className="mt-4 text-sm text-[var(--text-faint)]">
                We get what is in this form, plus five summary figures from your report if you ran
                one. It goes to our inbox and a private sheet. Never your files or order details.{' '}
                <Link href="/privacy" className="text-[var(--blue-light)] underline underline-offset-4 hover:text-white">
                  Privacy notice
                </Link>
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={sending} className="disabled:opacity-60">
                  {sending ? 'Sending' : 'Join the list'}
                </Button>
                <button type="button" className={pill} onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </dialog>
  )
}

export function WaitlistDialog() {
  const ctx = useContext(DialogStateContext)
  if (!ctx) throw new Error('WaitlistDialog outside WaitlistProvider')
  const { ref, state, setState, contact, close, stats } = ctx

  // Focus the ending once it renders, so a screen reader announces it.
  useEffect(() => {
    if (state.done) ref.current?.querySelector<HTMLElement>('#wl-done')?.focus()
  }, [state.done, ref])

  const onChange = (field: keyof Form, value: string) =>
    setState((s) => ({ ...s, form: { ...s.form, [field]: value } }))

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (state.sending) return
    const email = state.form.email.trim()
    if (!EMAIL_RE.test(email) || email.length > 200) {
      setState((s) => ({ ...s, invalid: true, error: 'That email address does not look right.' }))
      ref.current?.querySelector<HTMLInputElement>('#wl-email')?.focus()
      return
    }
    // A filled honeypot means a script, not a person: show the same ending, send nothing, count nothing.
    if (state.form.website) {
      setState((s) => ({ ...s, invalid: false, error: '', done: 'sent' }))
      return
    }
    const payload = buildPayload(state.form, stats)
    const { plan, parcels } = payload
    setState((s) => ({ ...s, invalid: false, error: '', sending: true }))
    const result = await submitWaitlist(payload, {
      fetch: window.fetch.bind(window),
      navigate: (href) => {
        window.location.href = href
      },
      contact,
    })
    if (result === 'failed') {
      setState((s) => ({ ...s, sending: false, error: 'That did not go through. Check your connection and try again.' }))
      return
    }
    track('afterlabel_waitlist_submit', { plan, parcels: parcels || 'not_given', result })
    setState((s) => ({ ...s, sending: false, done: result }))
  }

  return (
    <WaitlistDialogMarkup
      state={state}
      contact={contact}
      dialogRef={ref}
      onChange={onChange}
      onSubmit={onSubmit}
      onClose={close}
    />
  )
}

/** "Subscribe" on a plan: records the click, then opens the dialog with that plan chosen. */
export function PlanButton({ id, name }: { id: string; name: string }) {
  const { open } = useWaitlist()
  return (
    <button
      type="button"
      data-plan={id}
      aria-label={`Subscribe to ${name}`}
      className={`${pill} mt-6`}
      onClick={() => {
        const plan = isPlan(id) ? id : 'undecided'
        track('afterlabel_subscribe_click', { plan })
        open('plan', plan)
      }}
    >
      Subscribe
    </button>
  )
}

export function JoinLink({ children = 'Join the list' }: { children?: React.ReactNode }) {
  const { open } = useWaitlist()
  return (
    <button
      type="button"
      onClick={() => open('link')}
      className="text-[var(--blue-light)] underline underline-offset-4 hover:text-white"
    >
      {children}
    </button>
  )
}

export function JoinButton() {
  const { open } = useWaitlist()
  return (
    <Button type="button" onClick={() => open('link')}>
      Join the list
    </Button>
  )
}

/** Fires afterlabel_pricing_view once, when a quarter of the pricing section has been on screen. */
export function PricingViewTracker({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((x) => x.isIntersecting)) {
          io.disconnect()
          track('afterlabel_pricing_view')
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
