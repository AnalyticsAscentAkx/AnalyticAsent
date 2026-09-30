// Event tracking. PostHog if a key is configured, silence otherwise — the page
// has to work with no analytics at all, because that is how it runs locally and
// how it runs for anyone with a blocker.

type Props = Record<string, string | number | boolean | null>

declare global {
  interface Window {
    posthog?: { capture: (event: string, props?: Props) => void }
  }
}

export function track(event: string, props?: Props) {
  if (typeof window === 'undefined') return
  try {
    window.posthog?.capture(event, props)
  } catch {
    // Never let a missing analytics script break the tool.
  }
}
