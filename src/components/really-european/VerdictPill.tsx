import clsx from 'clsx'

import { VERDICT_LABEL, type Verdict } from '@/lib/really-european-labels'

// Blue is the only colour on this site and it means "interactive", so the four
// verdicts are told apart by weight and edge, not by hue: verified verdicts are
// solid, "unverified" is a dashed outline that reads as the absence of a
// finding. Class strings are literal so Tailwind can see them.
const STYLE: Record<Verdict, string> = {
  'eu-controlled': 'border border-[var(--line-bright)] bg-[var(--bg-card)] text-white',
  'non-eu-controlled': 'border border-white bg-white text-[var(--bg)]',
  'pe-controlled': 'border border-white text-white',
  unverified: 'border border-dashed border-[var(--line-bright)] text-[var(--text-dim)]',
}

export function VerdictPill({ verdict, className }: { verdict: Verdict; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        STYLE[verdict],
        className,
      )}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  )
}
