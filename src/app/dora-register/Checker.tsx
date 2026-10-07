'use client'

import { useCallback, useMemo, useState } from 'react'

import { toFeedbackCsv, groupFindings, type RuleGroup } from '@/lib/dora/feedback'
import { collectLeis, gleifFindings, lookupLeis, type LeiRecord } from '@/lib/dora/gleif'
import { analyse, type Insight } from '@/lib/dora/insight'
import { loadRegister } from '@/lib/dora/load'
import { CTPP_PUBLISHED } from '@/lib/dora/reference'
import { validate } from '@/lib/dora/rules'
import { buildSample, SEEDED } from '@/lib/dora/sample'
import { TABLES } from '@/lib/dora/schema'
import type { Finding, Register } from '@/lib/dora/types'
import { track } from '@/lib/track'

const SEV: Record<Finding['severity'], { dot: string; label: string; text: string; title: string; intro: string }> = {
  reject: {
    dot: 'bg-[#f59e0b]',
    label: 'Rejected',
    text: 'text-[#f59e0b]',
    title: 'Would be rejected at reception',
    intro: 'Technical checks, keys and closed lists. One of these and the whole package comes back with a NOK file; nothing after it is even looked at.',
  },
  warning: {
    dot: 'bg-[var(--blue-light)]',
    label: 'Data-quality feedback',
    text: 'text-[var(--blue-light)]',
    title: 'Would come back as data-quality feedback',
    intro: 'The DPM business rules and LEI checks. The package is accepted, and a feedback file lists these for resubmission. Also here: what the ITS makes mandatory but no rule enforces, which is where the 2026 content review will look.',
  },
  insight: {
    dot: 'bg-[var(--text-faint)]',
    label: 'Worth a look',
    text: 'text-[var(--text-faint)]',
    title: 'Worth a look',
    intro: 'Not errors. Things the data says that someone should have decided on purpose.',
  },
}

const LAYER_LABEL: Record<Finding['layer'], string> = {
  package: 'package',
  structure: 'file structure',
  keys: 'keys',
  values: 'values',
  business: 'business rule',
  identifiers: 'identifier',
  intelligence: 'register',
}

type GleifState =
  | { status: 'idle' }
  | { status: 'running'; done: number; total: number }
  | { status: 'done'; records: Map<string, LeiRecord>; findings: Finding[]; total: number; notFound: number; lapsed: number }
  | { status: 'error'; message: string }

export function Checker() {
  const [reg, setReg] = useState<Register | null>(null)
  const [label, setLabel] = useState<string>('')
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [gleif, setGleif] = useState<GleifState>({ status: 'idle' })
  const [isSample, setIsSample] = useState(false)

  const run = useCallback((r: Register, name: string, sample: boolean) => {
    const f = validate(r)
    setReg(r)
    setLabel(name)
    setFindings(f)
    setInsight(analyse(r))
    setGleif({ status: 'idle' })
    setIsSample(sample)
    setError(null)
    track('dora_checked', {
      sample,
      kind: r.meta.kind,
      tables: Object.keys(r.tables).length,
      rows: Object.values(r.tables).reduce((s, t) => s + t.rows.length, 0),
      rejects: f.filter((x) => x.severity === 'reject').length,
      warnings: f.filter((x) => x.severity === 'warning').length,
    })
  }, [])

  const onFiles = async (files: File[]) => {
    if (files.length === 0) return
    setBusy(true)
    try {
      const r = await loadRegister(files)
      run(r, files.length === 1 ? files[0].name : `${files.length} files`, false)
    } catch (e) {
      track('dora_read_failed', { ext: files[0].name.replace(/^.*\./, '').toLowerCase() })
      setError(e instanceof Error ? e.message : 'Could not read the file.')
    } finally {
      setBusy(false)
    }
  }

  const all = useMemo(() => {
    if (!findings) return null
    const extra = gleif.status === 'done' ? gleif.findings : []
    return [...findings, ...extra]
  }, [findings, gleif])

  const groups = useMemo(() => (all ? groupFindings(all) : []), [all])
  const counts = useMemo(() => {
    const c = { reject: 0, warning: 0, insight: 0 }
    for (const f of all ?? []) c[f.severity]++
    return c
  }, [all])

  const rowsRead = reg ? Object.values(reg.tables).reduce((s, t) => s + t.rows.length, 0) : 0

  const runGleif = async () => {
    if (!reg) return
    const leis = collectLeis(reg)
    if (leis.length === 0) {
      setGleif({ status: 'error', message: 'No well-formed LEIs to look up.' })
      return
    }
    setGleif({ status: 'running', done: 0, total: leis.length })
    track('dora_gleif', { leis: leis.length })
    try {
      const records = await lookupLeis(leis, (done, total) => setGleif({ status: 'running', done, total }))
      const f = gleifFindings(reg, records)
      const recs = [...records.values()]
      setGleif({
        status: 'done',
        records,
        findings: f,
        total: leis.length,
        notFound: recs.filter((r) => !r.found).length,
        lapsed: recs.filter((r) => r.found && r.status && r.status !== 'ISSUED').length,
      })
    } catch (e) {
      setGleif({ status: 'error', message: e instanceof Error ? e.message : 'GLEIF could not be reached.' })
    }
  }

  const download = () => {
    if (!all) return
    track('dora_download', { findings: all.length })
    const blob = new Blob([toFeedbackCsv(all)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `detailed-feedback-${(label || 'register').replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_.-]+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <DropZone busy={busy} onFiles={onFiles} onSample={() => run(buildSample(), 'the Veldhaven sample register', true)} />

      {error && (
        <p className="mt-6 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/5 px-4 py-3 text-sm text-[var(--text-dim)]">{error}</p>
      )}

      {reg && all && insight && (
        <div className="mt-14">
          {/* ---------------------------------------------------- verdict */}
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
            <div>
              <p className="text-sm font-semibold text-[var(--blue-light)]">Verdict</p>
              <h2 className="mt-2 font-display text-2xl font-medium text-white sm:text-3xl">
                {counts.reject > 0
                  ? 'This package would be rejected'
                  : counts.warning > 0
                    ? 'This package would be accepted, with data-quality feedback'
                    : 'Nothing to flag'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-dim)]">
                {label} — {Object.keys(reg.tables).length} of {TABLES.length} templates, {rowsRead.toLocaleString('en-GB')} rows.
                Read in this tab; nothing was uploaded.
                {isSample && ' The sample has twelve mistakes seeded on purpose; the list of what to expect is below the findings.'}
              </p>
            </div>
            <button
              onClick={download}
              className="rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)]"
            >
              Download detailed-feedback.csv
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Tile value={String(counts.reject)} label="would cause rejection" accent={counts.reject > 0} />
            <Tile value={String(counts.warning)} label="data-quality findings" />
            <Tile value={`${Object.keys(reg.tables).length}/${TABLES.length}`} label="templates received" accent={Object.keys(reg.tables).length < TABLES.length} />
            <Tile value={rowsRead.toLocaleString('en-GB')} label="rows checked" />
          </dl>

          {/* ---------------------------------------------------- GLEIF */}
          <GleifBlock state={gleif} count={collectLeis(reg).length} onRun={runGleif} />

          {/* ---------------------------------------------------- findings */}
          {(['reject', 'warning', 'insight'] as const).map((sev) => {
            const gs = groups.filter((g) => g.severity === sev)
            if (gs.length === 0) return null
            const s = SEV[sev]
            return (
              <section key={sev} className="mt-14">
                <div className="flex items-baseline gap-3">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />
                  <h3 className="font-display text-xl font-semibold text-white">{s.title}</h3>
                  <span className={`text-sm ${s.text}`}>{counts[sev].toLocaleString('en-GB')}</span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{s.intro}</p>
                <ul className="mt-6 space-y-3">
                  {gs.map((g) => (
                    <GroupCard key={`${g.rule}-${g.template}-${g.layer}`} g={g} />
                  ))}
                </ul>
              </section>
            )
          })}

          {isSample && (
            <section className="mt-14 rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 sm:p-8">
              <h3 className="font-display text-lg font-semibold text-white">What was seeded into the sample</h3>
              <p className="mt-2 text-sm text-[var(--text-dim)]">
                Each of these is a kind of error the 2025 collection actually produced. The group&apos;s own
                LEIs are invented and will come back as not found if you run the GLEIF check — that is the
                check working, not a bug. The providers are real, with their real public LEIs.
              </p>
              <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm text-[var(--text-dim)] sm:grid-cols-2">
                {SEEDED.map((s) => (
                  <li key={`${s.rule}-${s.what}`} className="flex gap-3">
                    <code className="shrink-0 text-xs text-[var(--blue-light)]">{s.rule}</code>
                    <span>
                      <span className="text-[var(--text-faint)]">{s.where}</span> — {s.what}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---------------------------------------------------- readout */}
          <Readout ins={insight} />
        </div>
      )}
    </div>
  )
}

function GleifBlock({ state, count, onRun }: { state: GleifState; count: number; onRun: () => void }) {
  return (
    <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-2xl">
          <h3 className="font-display font-semibold text-white">LEI checks against GLEIF</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
            The EBA's VR_2, VR_12, VR_16, VR_23, VR_71 and VR_77 checks look every LEI up in the Global LEI Index.
            This runs the same lookups from your browser, then goes further: it compares the names, countries
            and ultimate parents the register declares with what each entity has itself filed.
            {' '}
            <span className="text-white">This is the one step that leaves the tab.</span> It sends the{' '}
            {count.toLocaleString('en-GB')} LEI code{count === 1 ? '' : 's'} found in the register, and nothing else,
            directly to api.gleif.org (CC0 data, no account, nothing passes through this site).
          </p>
        </div>
        {state.status === 'idle' || state.status === 'error' ? (
          <button
            onClick={onRun}
            disabled={count === 0}
            className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)] disabled:opacity-50"
          >
            Check {count.toLocaleString('en-GB')} LEI{count === 1 ? '' : 's'} with GLEIF
          </button>
        ) : state.status === 'running' ? (
          <p className="text-sm text-[var(--text-dim)]">
            Looking up {state.done.toLocaleString('en-GB')} of {state.total.toLocaleString('en-GB')}…
          </p>
        ) : (
          <dl className="grid grid-cols-3 gap-6">
            <Tile small value={state.total.toLocaleString('en-GB')} label="looked up" />
            <Tile small value={String(state.notFound)} label="not in GLEIF" accent={state.notFound > 0} />
            <Tile small value={String(state.lapsed)} label="lapsed or retired" />
          </dl>
        )}
      </div>
      {state.status === 'error' && <p className="mt-3 text-sm text-[#fcd34d]">{state.message}</p>}
    </div>
  )
}

function GroupCard({ g }: { g: RuleGroup }) {
  const [open, setOpen] = useState(false)
  const shown = open ? g.examples : g.examples.slice(0, 2)
  return (
    <li className="rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <code className="rounded border border-[var(--line-bright)] bg-[var(--bg-raised)] px-1.5 py-0.5 text-xs text-[var(--blue-light)]">{g.rule}</code>
        <span className="font-display font-semibold text-white">{g.template === 'package' ? 'Package' : g.template}</span>
        <span className="text-xs text-[var(--text-faint)]">{LAYER_LABEL[g.layer]}</span>
        <span className="ml-auto text-sm text-[var(--text-dim)] tabular-nums">
          {g.count.toLocaleString('en-GB')} {g.count === 1 ? 'row' : 'rows'}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{g.message}</p>
      {g.examples.some((e) => e.row !== undefined || e.value) && (
        <ul className="mt-3 space-y-1 text-xs text-[var(--text-faint)]">
          {shown.map((e, i) => (
            <li key={i} className="flex flex-wrap gap-x-3">
              {e.row !== undefined && <span>row {e.row}</span>}
              {e.column && <span>{e.column}</span>}
              {e.value && <span className="break-all text-[var(--text-dim)]">{e.value}</span>}
              {e.message !== g.message && <span className="basis-full text-[var(--text-dim)]">{e.message}</span>}
            </li>
          ))}
          {g.count > shown.length && (
            <li>
              {g.examples.length > shown.length ? (
                <button onClick={() => setOpen(true)} className="text-[var(--blue-light)] hover:underline">
                  show {Math.min(g.examples.length, 5) - shown.length} more
                </button>
              ) : (
                <span>and {(g.count - shown.length).toLocaleString('en-GB')} more in the download</span>
              )}
            </li>
          )}
        </ul>
      )}
    </li>
  )
}

function Readout({ ins }: { ins: Insight }) {
  const fmt = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 0 })
  const pct = (x: number) => `${Math.round(x * 100)}%`
  const top = ins.byGroup.slice(0, 8)
  const max = Math.max(1, ...top.map((g) => g.expense))
  const hasExpense = ins.totalExpense > 0
  return (
    <section className="mt-20 border-t border-[var(--line)] pt-10">
      <p className="text-sm font-semibold text-[var(--blue-light)]">What the register says</p>
      <h3 className="mt-2 font-display text-2xl font-medium text-white">Where the dependence sits</h3>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">
        The same rows, joined the way the templates intend: services to functions through B_06.01, contracts
        to providers through B_03.02, providers to their ultimate parents through B_05.01. Providers on the
        ESAs&apos; list of critical ICT third-party providers ({CTPP_PUBLISHED}) are marked.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Tile value={fmt(ins.entities)} label={`entit${ins.entities === 1 ? 'y' : 'ies'} in scope${ins.branches ? `, ${ins.branches} branch${ins.branches === 1 ? '' : 'es'}` : ''}`} />
        <Tile value={fmt(ins.contracts)} label="contractual arrangements" />
        <Tile value={fmt(ins.directProviders || ins.providers)} label={`direct providers of ${fmt(ins.providers)} listed`} />
        <Tile value={`${fmt(ins.criticalFunctions)}/${fmt(ins.functions)}`} label="functions critical or important" />
      </dl>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h4 className="font-display font-semibold text-white">
            {hasExpense ? 'Annual expense by ultimate-parent group' : 'Critical services by ultimate-parent group'}
          </h4>
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            {hasExpense
              ? `Direct providers only, ${ins.currency}; subsidiaries rolled up to the parent the register names.`
              : 'No expense figures in B_05.01, so this counts service rows supporting critical functions instead.'}
          </p>
          <ul className="mt-5 space-y-3">
            {top.map((g) => {
              const w = hasExpense ? g.expense / max : g.criticalServices / Math.max(1, ...top.map((x) => x.criticalServices))
              return (
                <li key={g.code}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="truncate text-white">
                      {g.name}
                      {g.intraGroup && <span className="ml-2 text-xs text-[var(--text-faint)]">intra-group</span>}
                      {g.ctpp && <span className="ml-2 text-xs text-[var(--blue-light)]">designated critical</span>}
                      {g.cloud && <span className="ml-2 text-xs text-[var(--text-faint)]">cloud</span>}
                    </span>
                    <span className="shrink-0 text-[var(--text-dim)] tabular-nums">
                      {hasExpense ? `${fmt(g.expense)} · ${pct(g.share)}` : `${g.criticalServices} critical`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
                    <span
                      className="block h-full rounded-full bg-[var(--blue)]"
                      style={{ width: `${Math.max(2, w * 100)}%`, boxShadow: '0 0 10px rgb(59 130 246 / 0.4)' }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          {ins.byGroup.length > top.length && (
            <p className="mt-3 text-xs text-[var(--text-faint)]">and {ins.byGroup.length - top.length} more groups</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:col-span-5">
          <Tile value={pct(ins.topGroupShareOfCritical)} label="of critical services with the largest single group" accent={ins.topGroupShareOfCritical >= 0.4} />
          <Tile value={pct(ins.cloudShareOfCritical)} label="of critical services on cloud (S17–S19)" />
          <Tile value={ins.hhiGroup.toFixed(2)} label="Herfindahl index of expense by group (1 = one provider)" accent={ins.hhiGroup >= 0.25} />
          <Tile value={String(ins.ctpps.length)} label="providers on the ESAs' critical list" />
          <Tile value={String(ins.providersWithoutLei)} label="providers identified without an LEI" accent={ins.providersWithoutLei > 0} />
          <Tile value={String(ins.notSubstitutable)} label={`of ${ins.assessments} assessed services not, or hardly, substitutable`} />
        </dl>
      </div>

      {ins.locations.length > 0 && (
        <div className="mt-12">
          <h4 className="font-display font-semibold text-white">Where the data sits at rest</h4>
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            B_02.02 c0150, classified against the EEA and the Commission&apos;s adequacy decisions. Partial means
            the decision covers only some transfers (United States: Data Privacy Framework members; Canada:
            commercial organisations).
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line-bright)] text-left">
                  <Th>Location</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Service rows</Th>
                  <Th className="text-right">of which critical</Th>
                </tr>
              </thead>
              <tbody>
                {ins.locations.slice(0, 12).map((l) => (
                  <tr key={l.code} className="border-b border-[var(--line)]">
                    <Td className="py-2.5 text-white">{titleCase(l.label)}</Td>
                    <Td className={`py-2.5 ${l.cls === 'third-country' && l.criticalRows > 0 ? 'text-[#f59e0b]' : 'text-[var(--text-dim)]'}`}>
                      {{ eea: 'EEA', adequate: 'adequacy decision', partial: 'partial adequacy', 'third-country': 'third country', 'not-applicable': 'not applicable', unknown: 'unknown' }[l.cls]}
                    </Td>
                    <Td className="py-2.5 text-right text-[var(--text-dim)] tabular-nums">{l.rows}</Td>
                    <Td className="py-2.5 text-right text-[var(--text-dim)] tabular-nums">{l.criticalRows}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ins.ctpps.length > 0 && (
        <div className="mt-12">
          <h4 className="font-display font-semibold text-white">Designated critical ICT third-party providers in this register</h4>
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            Matched by LEI where the ESAs&apos; entity has one, otherwise by name. The ESAs publish names only; the
            LEIs behind the match were looked up by us and are listed on this page.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {ins.ctpps.map((c) => (
              <li key={c.provider.name} className="rule-fade pt-3 text-sm">
                <span className="text-white">{c.provider.name}</span>
                <span className="ml-2 text-[var(--text-faint)]">
                  {c.criticalServices} critical service{c.criticalServices === 1 ? '' : 's'}
                  {c.codes.length > 1 ? ` · ${c.codes.length} codes` : ''}
                  {c.provider.uk ? ' · also a UK critical third party' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function DropZone({ busy, onFiles, onSample }: { busy: boolean; onFiles: (f: File[]) => void; onSample: () => void }) {
  const [over, setOver] = useState(false)
  return (
    <div>
      <label
        htmlFor="dora-file"
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          onFiles(Array.from(e.dataTransfer.files ?? []))
        }}
        className={`block cursor-pointer rounded-3xl border border-dashed p-12 text-center transition ${
          over ? 'border-[var(--blue)] bg-[var(--blue)]/5' : 'border-[var(--line-bright)] hover:border-[var(--blue)]'
        }`}
      >
        <p className="font-display text-xl font-semibold text-white">{busy ? 'Reading…' : 'Drop the register here'}</p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--text-dim)]">
          The report package as you would submit it (.zip), the fifteen CSV files together, or the register
          workbook (.xlsx, one sheet per template). It is read in this browser tab and never sent anywhere.
        </p>
        <span className="mt-6 inline-block rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white">Choose files</span>
        <input
          id="dora-file"
          type="file"
          multiple
          accept=".zip,.csv,.xlsx"
          className="sr-only"
          onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      <p className="mt-4 text-center text-sm text-[var(--text-dim)]">
        Or{' '}
        <button onClick={onSample} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
          run it on a sample register with twelve known mistakes
        </button>{' '}
        to see what it catches.
      </p>
    </div>
  )
}

/** The taxonomy labels countries in capitals (NETHERLANDS). */
function titleCase(s: string): string {
  const small = new Set(['of', 'and', 'the', 'du', 'de', 'la', 'da'])
  return s
    .toLowerCase()
    .split(/(\s+|-|\(|\))/)
    .map((w, i) => (w && !small.has(w) || i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join('')
}

function Tile({ value, label, accent, small }: { value: string; label: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="rule-fade pt-4">
      <dd className={`stat font-display ${small ? 'text-2xl' : 'text-3xl'} font-medium ${accent ? '!text-[var(--blue-light)]' : ''}`}>{value}</dd>
      <dt className="mt-1 text-sm leading-5 text-[var(--text-faint)]">{label}</dt>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`pr-6 pb-3 font-medium text-[var(--text-faint)] last:pr-0 ${className}`}>{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`pr-6 align-top last:pr-0 ${className}`}>{children}</td>
}
