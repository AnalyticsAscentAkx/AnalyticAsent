'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/Button'
import {
  NoChargesError,
  UPS_FIELDS,
  analyse,
  generateSynthetic,
  parseCSV,
  parseShipStation,
  parseShopifyOrders,
  parseUps,
  type Report as EngineReport,
  type ShopOrder,
  type UpsFieldKey,
  type UpsMapping,
  type UpsParseResult,
} from '@/lib/afterlabel/engine'
import { bucket10, lineBucket, statsOf } from '@/lib/afterlabel/view'
import { track } from '@/lib/track'

import { Report } from './Report'
import { pill, useWaitlist } from './Waitlist'

// The upload flow. Files are read in this tab; parsing, matching and every figure come from the engine
// (src/lib/afterlabel/engine, synced from the afterlabel repo). This file only holds state and renders.

type Kind = 'ups' | 'shop' | 'ss'

interface Status {
  text: string
  ok: boolean
}

interface State {
  upsRows: string[][] | null
  override: UpsMapping
  parsed: UpsParseResult | null
  shop: Map<string, ShopOrder> | null
  ss: Map<string, string> | null
  sample: boolean
  reading: null | { kind: Kind; name: string }
  status: Record<Kind, Status>
  error: string
  report: EngineReport | null
  /** Bumped on every successful run, so focus moves to the report once it has rendered. */
  runs: number
}

const IDLE: Record<Kind, Status> = {
  ups: { text: 'Required', ok: false },
  shop: { text: 'Recommended', ok: false },
  ss: { text: 'Optional', ok: false },
}

const INITIAL: State = {
  upsRows: null,
  override: {},
  parsed: null,
  shop: null,
  ss: null,
  sample: false,
  reading: null,
  status: IDLE,
  error: '',
  report: null,
  runs: 0,
}

const ROWS: { kind: Kind; name: string; help: string; empty: string }[] = [
  {
    kind: 'ups',
    name: 'UPS invoice, CSV',
    help: 'From UPS Billing Center: open an invoice or a date range and download the billing data as CSV. Files with or without a header row both work.',
    empty: 'The UPS file looks empty.',
  },
  {
    kind: 'shop',
    name: 'Shopify orders export',
    help: 'Orders, then Export, CSV, for the date range the invoice covers. Adds what each customer paid for shipping and what was in the box.',
    empty: 'The Shopify file looks empty.',
  },
  {
    kind: 'ss',
    name: 'ShipStation shipments export',
    help: 'Only if your UPS reference field does not carry the order number. It links tracking numbers to orders.',
    empty: 'The ShipStation file looks empty.',
  },
]

// Fields shown in the manual column mapper, in order.
const MAP_KEYS: UpsFieldKey[] = ['tracking', 'lead', 'ref1', 'ref2', 'cat', 'desc', 'net', 'entered', 'billed', 'date']
const MAP_FIELDS = UPS_FIELDS.filter((f) => MAP_KEYS.includes(f.key)).sort(
  (a, b) => MAP_KEYS.indexOf(a.key) - MAP_KEYS.indexOf(b.key),
)

const NO_CHARGES =
  'No charges found in the UPS file. Open “Check which UPS columns were used” and point Net amount at the column with the charge amounts.'

const SAMPLE_EVENT = 'afterlabel:run-sample'

/** Runs the engine on the given state. Returns the next state; fires the run's analytics event. */
function runReport(S: State): State {
  if (!S.parsed) return S
  let r: EngineReport
  try {
    r = analyse(S.parsed.lines, { shop: S.shop, shipstation: S.ss })
  } catch (e) {
    if (e instanceof NoChargesError) {
      track('afterlabel_no_charges')
      return { ...S, error: NO_CHARGES, report: null }
    }
    return { ...S, error: e instanceof Error ? e.message : String(e), report: null }
  }
  if (!S.sample) track('afterlabel_real_run', { has_shopify: !!r.hasShopify, has_shipstation: !!S.ss, ups_variant: S.parsed.variant.id, match_rate: bucket10(r.matchRate), line_count: lineBucket(r.lines.total) })
  return { ...S, error: '', report: r, runs: S.runs + 1 }
}

function sampleState(seed: number): State {
  const d = generateSynthetic({ seed })
  const upsRows = parseCSV(d.ups)
  return {
    ...INITIAL,
    upsRows,
    parsed: parseUps(upsRows),
    shop: parseShopifyOrders(parseCSV(d.shop)),
    sample: true,
    status: {
      ups: { text: 'Sample UPS invoice, September', ok: true },
      shop: { text: 'Sample store with 420 orders', ok: true },
      ss: { text: 'Optional', ok: false },
    },
  }
}

/** The hero's button. The tool listens for it, so the readout and the panel run the same code. */
export function RunSampleButton() {
  return (
    <button type="button" className={pill} onClick={() => window.dispatchEvent(new Event(SAMPLE_EVENT))}>
      Run the sample
    </button>
  )
}

export function Tool({ sampleSeed }: { sampleSeed: number }) {
  const [S, setS] = useState<State>(INITIAL)
  const [drag, setDrag] = useState<Kind | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const { setStats } = useWaitlist()

  const runSample = () => {
    const next = runReport(sampleState(sampleSeed))
    setS((prev) => ({ ...next, runs: prev.runs + 1 }))
    track('afterlabel_sample_run')
  }
  const runSampleRef = useRef(runSample)
  runSampleRef.current = runSample

  useEffect(() => {
    const on = () => runSampleRef.current()
    window.addEventListener(SAMPLE_EVENT, on)
    return () => window.removeEventListener(SAMPLE_EVENT, on)
  }, [])

  // The waitlist may carry the five summary figures of the visitor's own report, never the sample's.
  useEffect(() => {
    setStats(S.report ? statsOf(S.report, S.sample) : null)
  }, [S.report, S.sample, setStats])

  // After a run: the report heading takes focus and the page moves to it.
  useEffect(() => {
    if (!S.runs || !heading.current) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    heading.current.focus({ preventScroll: true })
    heading.current.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [S.runs])

  const readFile = async (kind: Kind, file: File) => {
    const row = ROWS.find((x) => x.kind === kind)!
    setS((s) => ({ ...(s.sample ? INITIAL : s), runs: s.runs, error: '', reading: { kind, name: file.name } }))
    // Let "Reading" paint before a large file blocks the thread.
    await new Promise((done) => setTimeout(done))
    try {
      const rows = parseCSV(await file.text())
      if (rows.length < 2) throw new Error(row.empty)
      const status = { text: `${file.name}: ${rows.length.toLocaleString('en-US')} rows read`, ok: true }
      setS((s) => {
        const base = { ...s, reading: null, status: { ...s.status, [kind]: status } }
        if (kind === 'ups') return { ...base, upsRows: rows, override: {}, parsed: parseUps(rows) }
        if (kind === 'shop') return { ...base, shop: parseShopifyOrders(rows) }
        return { ...base, ss: parseShipStation(rows) }
      })
    } catch (err) {
      setS((s) => ({ ...s, reading: null, error: err instanceof Error ? err.message : String(err) }))
    }
  }

  const onMap = (key: UpsFieldKey, value: number) => {
    track('afterlabel_mapper_change', { field: key })
    if (!S.upsRows) return
    const override = { ...S.override, [key]: value }
    // The engine refuses personal data columns; its mapping shows such a field as not in this file.
    const next = { ...S, override, parsed: parseUps(S.upsRows, { override }) }
    setS(S.report ? runReport(next) : next)
  }

  const statusOf = (kind: Kind): Status =>
    S.reading?.kind === kind ? { text: `Reading ${S.reading.name}…`, ok: false } : S.status[kind]

  return (
    <div>
      <div className="max-w-3xl">
        <h2 className="font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
          Three exports, one report
        </h2>
        <p className="mt-3 text-lg text-[var(--text-dim)]">
          Start with the UPS invoice. The other two files sharpen the report; neither is required.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 sm:p-10">
        <div className="space-y-2">
          {ROWS.map((row, i) => {
            const st = statusOf(row.kind)
            const id = `f-${row.kind}`
            return (
              <div
                key={row.kind}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDrag(row.kind)
                }}
                onDragLeave={() => setDrag((d) => (d === row.kind ? null : d))}
                onDrop={(e) => {
                  e.preventDefault()
                  setDrag(null)
                  const f = e.dataTransfer.files[0]
                  if (f) readFile(row.kind, f)
                }}
                className={`grid gap-x-8 gap-y-3 rounded-xl border px-4 py-5 transition sm:grid-cols-[1fr_auto] sm:items-center ${
                  drag === row.kind ? 'border-[var(--blue)]' : 'border-transparent'
                } ${i ? 'rule-fade' : ''}`}
              >
                <div>
                  <p className="font-display text-lg font-semibold text-white">{row.name}</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-dim)]">{row.help}</p>
                  <p aria-live="polite" className={`mt-2 text-sm ${st.ok ? 'text-white' : 'text-[var(--text-faint)]'}`}>
                    {st.ok ? <span aria-hidden="true" className="mr-2 inline-block h-px w-4 bg-[var(--blue)] align-middle" /> : null}
                    {st.text}
                  </p>
                </div>
                <div>
                  <label htmlFor={id} className={`${pill} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--blue-light)]`}>
                    Choose file
                    <span className="sr-only"> for {row.name}</span>
                    <input
                      id={id}
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        e.target.value = ''
                        if (f) readFile(row.kind, f)
                      }}
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rule-fade mt-4 flex flex-wrap items-center gap-4 pt-8">
          <Button type="button" disabled={!S.parsed} onClick={() => setS(runReport(S))} className="disabled:cursor-not-allowed disabled:opacity-50">
            Show my real costs
          </Button>
          <button type="button" className={pill} onClick={runSample}>
            Try it with sample data
          </button>
          {!S.parsed ? <p className="text-sm text-[var(--text-faint)]">Add the UPS invoice to run the report.</p> : null}
        </div>

        {S.error ? (
          <p role="alert" className="mt-4 rounded-lg border border-[var(--line-bright)] bg-[var(--bg-card)] px-4 py-3 text-sm text-white">
            {S.error}
          </p>
        ) : null}

        {S.parsed && S.upsRows ? <Mapper key={S.upsRows.length + ':' + (S.parsed.header ? 'h' : 'n')} S={S} onMap={onMap} /> : null}
      </div>

      {S.report ? (
        <div className="scroll-mt-24">
          {S.sample ? (
            <p className="mt-10 border-l border-[var(--blue)] pl-4 text-[var(--text-dim)]">
              This is the sample store: 420 synthetic orders and one month of invoice lines. Drop in your own files for your numbers.
            </p>
          ) : null}
          <Report report={S.report} headingRef={heading} />
        </div>
      ) : null}
    </div>
  )
}

function Mapper({ S, onMap }: { S: State; onMap: (key: UpsFieldKey, value: number) => void }) {
  const P = S.parsed!
  const rows = S.upsRows!
  const header = P.header
  const body = header ? rows.slice(1) : rows
  const width = Math.max(...body.slice(0, 50).map((r) => r.length), header ? header.length : 0)
  const sample = body.find((r) => r.length >= width) || body[0] || []
  const options = Array.from({ length: width }, (_, i) => {
    const name = header ? header[i] : ''
    const eg = (sample[i] ?? '').slice(0, 24)
    return `Column ${i + 1}${name ? ': ' + name : ''}${eg ? ' (e.g. ' + eg + ')' : ''}`
  })
  return (
    <details open={!header} className="rule-fade mt-8 pt-6">
      <summary className="cursor-pointer text-sm font-semibold text-white">Check which UPS columns were used</summary>
      <p className="mt-3 text-sm text-[var(--text-faint)]">
        Columns holding recipient names or addresses cannot be chosen; they show as not in this file.
      </p>
      <div className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {MAP_FIELDS.map(({ key, label }) => (
          <label key={key} className="grid gap-1 text-sm text-[var(--text-dim)]">
            {label}
            <select
              value={String(P.mapping[key] ?? -1)}
              onChange={(e) => onMap(key, +e.target.value)}
              className="w-full rounded-lg border border-[var(--line-bright)] bg-[var(--bg-raised)] px-3 py-2 text-base text-white"
            >
              <option value="-1">Not in this file</option>
              {options.map((o, i) => (
                <option key={i} value={String(i)}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </details>
  )
}
