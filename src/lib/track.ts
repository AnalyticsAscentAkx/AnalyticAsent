// Event tracking.
//
// This used to send only to PostHog, which is loaded only when a key is
// configured — and none is. GA4 is what actually runs on the site, so every
// event the tools fired went nowhere. Send to whichever is present.
//
// Nothing here may throw: an ad blocker removing gtag is the normal case, not
// an error, and a missing analytics script must never break a tool.

type Props = Record<string, string | number | boolean | null>

declare global {
  interface Window {
    posthog?: { capture: (event: string, props?: Props) => void }
    gtag?: (command: string, ...args: unknown[]) => void
  }
}

export function track(event: string, props?: Props) {
  if (typeof window === 'undefined') return
  try {
    window.gtag?.('event', event, props ?? {})
  } catch {
    // ignore
  }
  try {
    window.posthog?.capture(event, props)
  } catch {
    // ignore
  }
}
