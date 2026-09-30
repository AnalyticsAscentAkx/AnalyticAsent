'use client'

import { useCallback, useMemo, useState } from 'react'

import { parseDelimited, readSpreadsheet } from '@/lib/cm/parse'
import {
  clean,
  MESSY_SAMPLE,
  profile,
  toCsv,
  type Issue,
  type Profile,
} from '@/lib/profile'

type Rows = Record<string, string>[]

const SEVERITY: Record<Issue['severity'], { dot: string; label: string; text: string }> = {
  high: { dot: 'bg-[#f59e0b]', label: 'Costly', text: 'text-[#f59e0b]' },
  medium: { dot: 'bg-[var(--blue-light)]', label: 'Worth fixing', text: 'text-[var(--blue-light)]' },
  low: { dot: 'bg-[var(--text-faint)]', label: 'Tidy-up', text: 'text-[var(--text-faint)]' },
}

const TYPE_LABEL: Record<string, string> = {
  number: 'number',
  integer: 'whole number',
  date: 'date',
  boolean: 'yes/no',
  category: 'category',
  text: 'text',
  empty: 'empty',
}

export function Clinic() {
  const [rows, setRows] = useState<Rows | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const prof: Profile | null = useMemo(() => (rows ? profile(rows) : null), [rows])
  const cleaned = useMemo(() => (rows && prof ? clean(rows, prof) : null), [rows, prof])

  const load = useCallback((parsed: Rows, label: string) => {
    if (parsed.length === 0) {
      setError('No rows found. The file needs a header row and at least one row under it.')
      return
    }
    setError(null)
    setRows(parsed.slice(0, 5000))
    setName(label)
  }, [])

  const onFile = async (file: File) => {
    setBusy(true)
    try {
      load(await readSpreadsheet(file), file.name)
    } catch (e) {
      setError(`Could not read ${file.name}: ${e instanceof Error ? e.message : 'unknown error'}`)
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    if (!cleaned) return
    const blob = new Blob([toCsv(cleaned)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cleaned-${name?.replace(/\.[^.]+$/, '') ?? 'data'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <DropZone
        busy={busy}
        onFile={onFile}
        onSample={() => load(parseDelimited(MESSY_SAMPLE), 'a deliberately awful export')}
      />

      {error && (
        <p className="mt-6 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/5 px-4 py-3 text-sm text-[var(--text-dim)]">
          {error}
        </p>
      )}

      {prof && rows && cleaned && (
        <div className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--line)] pb-6">
            <div>
              <h2 className="font-display text-2xl font-medium text-white">
                {prof.issues.length === 0
                  ? 'Nothing worth flagging'
                  : `${prof.issues.length} thing${prof.issues.length === 1 ? '' : 's'} worth knowing about`}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-dim)]">
                {name} — {prof.rows.toLocaleString('en-GB')} rows, {prof.columns.length} columns.
                Read in this tab; nothing was uploaded.
              </p>
            </div>
            <button
              onClick={download}
              className="rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)]"
            >
              Download the cleaned CSV
            </button>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Tile value={prof.rows.toLocaleString('en-GB')} label="rows read" />
            <Tile
              value={cleaned.length.toLocaleString('en-GB')}
              label="rows after de-duplicating"
              accent={cleaned.length !== prof.rows}
            />
            <Tile value={String(prof.columns.length)} label="columns profiled" />
            <Tile
              value={String(prof.issues.filter((i) => i.severity === 'high').length)}
              label="costly problems"
              accent={prof.issues.some((i) => i.severity === 'high')}
            />
          </dl>

          {prof.issues.length > 0 && (
            <ul className="mt-12 space-y-4">
              {prof.issues.map((issue, i) => {
                const s = SEVERITY[issue.severity]
                return (
                  <li
                    key={`${issue.kind}-${issue.column ?? ''}-${i}`}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-6"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />
                      <h3 className="font-display font-semibold text-white">{issue.title}</h3>
                      <span className={`text-xs ${s.text}`}>{s.label}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{issue.detail}</p>
                    {issue.examples.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {issue.examples.map((ex, j) => (
                          <li
                            key={j}
                            className="rounded border border-[var(--line-bright)] bg-[var(--bg-raised)] px-2 py-1 text-xs text-[var(--text-dim)]"
                          >
                            {ex}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          <h3 className="mt-16 font-display text-xl font-semibold text-white">
            What each column turned out to be
          </h3>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line-bright)] text-left">
                  <Th>Column</Th>
                  <Th>Reads as</Th>
                  <Th className="text-right">Filled</Th>
                  <Th className="text-right">Distinct</Th>
                  <Th>Examples</Th>
                </tr>
              </thead>
              <tbody>
                {prof.columns.map((c) => (
                  <tr key={c.name} className="border-b border-[var(--line)]">
                    <Td className="py-3 font-medium text-white">{c.name || <em>unnamed</em>}</Td>
                    <Td className="py-3 text-[var(--blue-light)]">{TYPE_LABEL[c.type]}</Td>
                    <Td className="py-3 text-right text-[var(--text-dim)] tabular-nums">
                      {Math.round((c.filled / Math.max(prof.rows, 1)) * 100)}%
                    </Td>
                    <Td className="py-3 text-right text-[var(--text-dim)] tabular-nums">
                      {c.distinct.toLocaleString('en-GB')}
                    </Td>
                    <Td className="py-3 text-[var(--text-faint)]">
                      {c.examples.join(' · ') || '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-16 font-display text-xl font-semibold text-white">
            The first rows, cleaned
          </h3>
          <p className="mt-2 text-sm text-[var(--text-dim)]">
            Trimmed, de-duplicated, placeholders emptied and numbers put on one convention. Dates
            are left exactly as they arrived — guessing whether 03/04 is March or April is worse
            than leaving it for someone who knows.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line-bright)] text-left">
                  {prof.columns.map((c) => (
                    <Th key={c.name}>{c.name || '—'}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cleaned.slice(0, 8).map((r, i) => (
                  <tr key={i} className="border-b border-[var(--line)]">
                    {prof.columns.map((c) => (
                      <Td key={c.name} className="py-3 text-[var(--text-dim)]">
                        {r[c.name] || <span className="text-[var(--text-faint)]">—</span>}
                      </Td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function DropZone({
  busy,
  onFile,
  onSample,
}: {
  busy: boolean
  onFile: (f: File) => void
  onSample: () => void
}) {
  const [over, setOver] = useState(false)
  return (
    <div>
      <label
        htmlFor="clinic-file"
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onFile(f)
        }}
        className={`block cursor-pointer rounded-3xl border border-dashed p-12 text-center transition ${
          over
            ? 'border-[var(--blue)] bg-[var(--blue)]/5'
            : 'border-[var(--line-bright)] hover:border-[var(--blue)]'
        }`}
      >
        <p className="font-display text-xl font-semibold text-white">
          {busy ? 'Reading…' : 'Drop a spreadsheet here'}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-dim)]">
          CSV or Excel, up to 5,000 rows. The worse it is the more useful this gets. It is read in
          this browser tab and never sent anywhere.
        </p>
        <span className="mt-6 inline-block rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white">
          Choose a file
        </span>
        <input
          id="clinic-file"
          type="file"
          accept=".csv,.tsv,.txt,.xlsx"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </label>
      <p className="mt-4 text-center text-sm text-[var(--text-dim)]">
        Or{' '}
        <button onClick={onSample} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
          run it on a deliberately awful export
        </button>{' '}
        to see what it catches.
      </p>
    </div>
  )
}

function Tile({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="border-t border-[var(--line-bright)] pt-4">
      <dd
        className={`font-display text-3xl font-medium tabular-nums ${
          accent ? 'text-[var(--blue-light)]' : 'text-white'
        }`}
      >
        {value}
      </dd>
      <dt className="mt-1 text-sm leading-5 text-[var(--text-faint)]">{label}</dt>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`pr-6 pb-3 font-medium text-[var(--text-faint)] last:pr-0 ${className}`}>
      {children}
    </th>
  )
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`pr-6 align-top last:pr-0 ${className}`}>{children}</td>
}
