'use client'

import { useEffect, useState } from 'react'

// Asks once whether Google Analytics may set its cookies. Until someone says
// yes, consent stays denied and GA sends only cookieless pings, which Google
// discards at this site's traffic — that is why GA showed nothing for months.
//
// Accept and Decline carry equal weight on purpose: the Dutch and EU
// regulators treat a louder "accept" as consent that was not freely given.
// Advertising storage is never granted; the site runs no ads.

export const CONSENT_KEY = 'aa-consent'

type Choice = 'granted' | 'denied'

function stored(): Choice | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function ConsentBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (stored() === null) setOpen(true)
  }, [])

  function choose(choice: Choice) {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice)
    } catch {}
    const w = window as unknown as { gtag?: (...a: unknown[]) => void }
    w.gtag?.('consent', 'update', { analytics_storage: choice })
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Analytics cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-[var(--line-bright)] bg-[var(--bg-raised)] p-5 shadow-2xl sm:inset-x-6"
    >
      <p className="text-sm leading-6 text-[var(--text-dim)]">
        May we use Google Analytics cookies to count visits and see which pages
        and tools are useful? No advertising, nothing sold, and the tools work
        the same either way.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => choose('granted')}
          className="flex-1 rounded-full border border-[var(--line-bright)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => choose('denied')}
          className="flex-1 rounded-full border border-[var(--line-bright)] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
        >
          Decline
        </button>
      </div>
    </div>
  )
}
