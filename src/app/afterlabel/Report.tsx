'use client'

import { ADJ_BUCKETS, type Report as EngineReport } from '@/lib/afterlabel/engine'
import { viewModel, type ViewModel } from '@/lib/afterlabel/view'
import { track } from '@/lib/track'

import { JoinButton, pill } from './Waitlist'
import { money, pct, signed } from './format'

// The report: a pure rendering of the engine's Report. Corrections after the label are what the page is
// about, so they take the blue; every other bucket takes the same inert grey the site's charts use.

const INERT = '#64748b'

const th = 'py-2 pr-4 text-left text-xs font-semibold text-[var(--text-faint)]'
const thNum = `${th} text-right`
const td = 'border-b border-[var(--line)] py-3 pr-4 text-[var(--text-dim)]'
const tdNum = `${td} text-right tabular-nums`
const note = 'mt-3 max-w-3xl text-[var(--text-dim)]'
const h2 = 'font-display text-2xl font-medium text-white'

function exportOrders(R: ViewModel) {
  track('afterlabel_csv_download')
  const esc = (v: string | number) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))
  const rows: (string | number)[][] = [['order', 'date', 'packages', 'customer_paid', 'ups_billed', 'corrections', 'result']]
  for (const o of R.shipped)
    rows.push([o.id, o.date || '', o.packages, o.charged ?? '', o.cost.toFixed(2), o.adj.toFixed(2), o.result == null ? '' : o.result.toFixed(2)])
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'afterlabel-orders.csv'
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const resultClass = (v: number) => (v < 0 ? 'text-[var(--blue-light)]' : 'text-white')

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rule-fade flex flex-col-reverse justify-end pt-4">
      <dt className="mt-1 text-sm leading-5 text-[var(--text-faint)]">{label}</dt>
      <dd className="stat font-display text-2xl font-medium whitespace-nowrap sm:text-3xl">{children}</dd>
    </div>
  )
}

export function Report({
  report,
  headingRef,
}: {
  report: EngineReport
  headingRef?: React.Ref<HTMLHeadingElement>
}) {
  const R = viewModel(report)
  const orders = R.hasShop
    ? [...R.withCharge].sort((a, b) => (a.result as number) - (b.result as number))
    : [...R.shipped].sort((a, b) => b.cost - a.cost)
  const skus = [...R.skus].sort((a, b) => a.result - b.result).slice(0, 10)
  const buckets = [...R.bucketList].sort((a, b) => b.amount - a.amount)

  return (
    <section aria-labelledby="report-h" className="mt-16">
      <div className="rule-fade pt-8">
        <h2 id="report-h" ref={headingRef} tabIndex={-1} className="scroll-mt-8 text-sm font-semibold text-white outline-none">
          Charged after the label
        </h2>
        <p className="stat mt-3 font-display text-6xl font-medium sm:text-7xl">{money(R.adjTotal)}</p>
        <p className="mt-3 max-w-2xl text-lg text-[var(--text-dim)]">
          {pct(R.adjShare)} of your UPS spend arrived as corrections after the label was printed.
        </p>
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        <Figure label="UPS spend in this file">{money(R.total)}</Figure>
        <Figure label="Tied to an order">{pct(R.matchRate)}</Figure>
        {R.hasShop ? <Figure label="Customers paid for shipping">{money(R.charged)}</Figure> : null}
        {R.hasShop ? <Figure label="Shipping result">{signed(R.shipResult)}</Figure> : null}
        {R.hasShop ? (
          <Figure label="Orders that lost money on shipping">
            {R.losingCount}{' '}
            <span className="text-base font-normal text-[var(--text-dim)]">of {R.withChargeCount}</span>
          </Figure>
        ) : (
          <Figure label="Orders found">{String(R.shipped.length)}</Figure>
        )}
      </dl>

      <div className="mt-16">
        <h2 className={h2}>Where the money went</h2>
        <p className={note}>
          Every charge line on the invoice, grouped. Blue bars are corrections UPS added after you shipped.
        </p>
        <ul role="list" className="mt-8 space-y-4">
          {buckets.map((b) => {
            const adj = ADJ_BUCKETS.has(b.bucket)
            return (
              <li
                key={b.bucket}
                aria-label={`${b.bucket}: ${money(b.amount)} (${pct(b.share)})`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 text-sm sm:grid-cols-[minmax(150px,240px)_1fr_150px]"
              >
                <span className={adj ? 'text-white' : 'text-[var(--text-dim)]'}>{b.bucket}</span>
                <span aria-hidden="true" className="order-3 col-span-2 h-2 overflow-hidden rounded-full bg-[var(--line)] sm:order-none sm:col-span-1">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(1, b.relative * 100)}%`, background: adj ? 'var(--blue)' : INERT }}
                  />
                </span>
                <span className="text-right text-[var(--text-dim)] tabular-nums">
                  {money(b.amount)} ({pct(b.share)})
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-16">
        <h2 className={h2}>{R.hasShop ? 'Orders that cost you the most' : 'Most expensive orders'}</h2>
        <p className={note}>
          {R.hasShop
            ? 'What the customer paid for shipping against what UPS billed for every package on that order.'
            : 'Add your Shopify orders export to see what customers paid against what UPS billed.'}
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line-bright)]">
                <th scope="col" className={th}>Order</th>
                <th scope="col" className={th}>Date</th>
                <th scope="col" className={thNum}>{R.hasShop ? 'Customer paid' : 'Packages'}</th>
                <th scope="col" className={thNum}>UPS billed</th>
                <th scope="col" className={thNum}>Of which corrections</th>
                {R.hasShop ? <th scope="col" className={thNum}>Result</th> : null}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 15).map((o, i) => (
                <tr key={`${o.id}-${i}`}>
                  <td className={`${td} text-white`}>{o.id}</td>
                  <td className={`${td} tabular-nums`}>{o.date || ''}</td>
                  <td className={tdNum}>{R.hasShop ? money(o.charged as number) : String(o.packages)}</td>
                  <td className={tdNum}>{money(o.cost)}</td>
                  <td className={`${tdNum} ${o.adj > 0 ? 'text-[var(--blue-light)]' : ''}`}>{money(o.adj)}</td>
                  {R.hasShop ? (
                    <td className={`${tdNum} ${resultClass(o.result as number)}`}>{signed(o.result as number)}</td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className={`${pill} mt-6`} onClick={() => exportOrders(R)}>
          Download every order as CSV
        </button>
      </div>

      {R.hasShop && skus.length ? (
        <div className="mt-16">
          <h2 className={h2}>Products driving the cost</h2>
          <p className={note}>
            Each order&apos;s UPS cost split across its items by quantity, sorted by how much shipping each product loses you.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line-bright)]">
                  <th scope="col" className={th}>Product</th>
                  <th scope="col" className={thNum}>Units</th>
                  <th scope="col" className={thNum}>UPS cost per unit</th>
                  <th scope="col" className={thNum}>Corrections</th>
                  <th scope="col" className={thNum}>Shipping result</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((s) => (
                  <tr key={s.sku}>
                    <td className={`${td} text-white`}>{s.name}</td>
                    <td className={tdNum}>{String(s.units)}</td>
                    <td className={tdNum}>{money(s.perUnit)}</td>
                    <td className={tdNum}>{money(s.adj)}</td>
                    <td className={`${tdNum} ${resultClass(s.result)}`}>{signed(s.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {R.pkgCount ? (
        <div className="mt-16">
          <h2 className={h2}>Billed heavier than you entered</h2>
          <p className={note}>
            {R.heavyCount
              ? `${R.heavyCount} of ${R.pkgCount} packages (${pct(R.heavyShare)}) were billed at more than 110% of the weight on the label, usually dimensional weight. Those packages cost ${money(R.heavyCost)} in total. A smaller box or a different mailer often fixes this.`
              : 'No packages were billed meaningfully above the weight on the label, or the file has no weight columns.'}
          </p>
        </div>
      ) : null}

      {R.unmatched > 0 ? (
        <p className={`${note} mt-10`}>
          {money(R.unmatched)} of charges could not be tied to an order. If your UPS reference field does not hold the order number, add the ShipStation shipments export.
        </p>
      ) : null}

      <div className="rule-fade mt-16 pt-8">
        <h2 className={h2}>Get this every week, without the download</h2>
        <p className={note}>
          Forward your UPS invoices to a private address and the app runs this report on each one,
          writing every order&apos;s true shipping cost back into Shopify. It is being built; the list is open.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <JoinButton />
          <a href="#pricing" className={pill}>
            See the planned prices
          </a>
        </div>
      </div>
    </section>
  )
}
