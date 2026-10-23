import { RunSampleButton } from './Tool'
import { money, pct } from './format'

// The hero's object: the sample report's own figures, computed at build time in page.tsx by the same engine
// and seed the "Run the sample" button uses, so the readout and the report it opens agree by construction.
// Static on purpose: no gauge and no count-up. The trucks behind it are the page's one moving thing.

export function SampleReadout({
  adjustments,
  adjustmentShare,
  matchRate,
  ordersLosing,
  ordersWithCharge,
}: {
  adjustments: number
  adjustmentShare: number
  matchRate: number
  ordersLosing: number
  ordersWithCharge: number
}) {
  return (
    <div
      className="relative w-full max-w-md rounded-3xl border border-[var(--line-bright)] bg-[rgb(12_20_36/0.72)] p-6 backdrop-blur-md sm:p-7 lg:justify-self-end"
      role="group"
      aria-label={`Sample invoice, one month: ${money(adjustments)} charged after the label, ${pct(adjustmentShare)} of UPS spend; ${pct(matchRate)} tied to an order; ${ordersLosing} of ${ordersWithCharge} orders lost money on shipping.`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--blue-light)]/60 to-transparent"
      />
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold text-white">Sample invoice, one month</p>
        <p className="text-xs text-[var(--text-faint)]">synthetic store, 420 orders, seed 7</p>
      </div>
      {/* dt first for assistive tech, shown under the figure. */}
      <dl className="mt-6 flex flex-col-reverse justify-end">
        <dt className="mt-2 text-sm text-[var(--text-dim)]">charged after the label</dt>
        <dd className="stat font-display text-5xl font-medium">{money(adjustments)}</dd>
      </dl>
      <dl className="rule-fade mt-6 grid grid-cols-3 gap-x-4 pt-5">
        <div className="flex flex-col-reverse justify-end">
          <dt className="mt-1 text-xs leading-4 text-[var(--text-faint)]">of UPS spend</dt>
          <dd className="stat font-display text-2xl font-medium">{pct(adjustmentShare)}</dd>
        </div>
        <div className="flex flex-col-reverse justify-end">
          <dt className="mt-1 text-xs leading-4 text-[var(--text-faint)]">tied to an order</dt>
          <dd className="stat font-display text-2xl font-medium">{pct(matchRate)}</dd>
        </div>
        <div className="flex flex-col-reverse justify-end">
          <dt className="mt-1 text-xs leading-4 text-[var(--text-faint)]">orders lost money on shipping</dt>
          <dd className="stat font-display text-2xl font-medium whitespace-nowrap">
            {ordersLosing}{' '}
            <span className="text-sm font-normal text-[var(--text-dim)]">of {ordersWithCharge}</span>
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <RunSampleButton />
        <p className="text-xs text-[var(--text-faint)]">Or drop your own files in below.</p>
      </div>
    </div>
  )
}
