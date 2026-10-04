'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AlloyTable } from '@/lib/cm/catalogue'
import { enrichAll, readSpreadsheet } from '@/lib/cm/parse'
import type { AlloyGrade, Benchmark, MatchResult, Model, Part } from '@/lib/cm/types'
import { dims, eur, pct, qty, shortDate } from './format'
import { track } from './track'

const BASE = '/cm-optimiser'

type Status = 'loading' | 'ready' | 'error'
type Tab = 'demo' | 'upload'

const BAND_STYLE: Record<string, { rule: string; text: string; label: string }> = {
  HIGH: { rule: 'bg-[var(--blue-light)]', text: 'text-[var(--blue-light)]', label: 'High' },
  MEDIUM: { rule: 'bg-neutral-400', text: 'text-[var(--text-dim)]', label: 'Medium' },
  LOW: { rule: 'bg-[var(--line-bright)]', text: 'text-[var(--text-faint)]', label: 'Low' },
}

export function Optimiser() {
  const workerRef = useRef<Worker | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  const [model, setModel] = useState<Model | null>(null)
  const [alloys, setAlloys] = useState<AlloyTable | null>(null)
  const [grades, setGrades] = useState<AlloyGrade[]>([])
  const [demo, setDemo] = useState<Part[]>([])

  const [tab, setTab] = useState<Tab>('demo')
  const [mode, setMode] = useState<'enriched' | 'raw'>('enriched')
  const [part, setPart] = useState<Part | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [catalogueSize, setCatalogueSize] = useState(0)
  const [catalogueSource, setCatalogueSource] = useState<'sample' | 'yours'>('sample')
  const [uploadNote, setUploadNote] = useState<string | null>(null)
  const [uploadedParts, setUploadedParts] = useState<Part[]>([])

  // --- worker ---------------------------------------------------------------
  useEffect(() => {
    const w = new Worker(new URL('./worker.ts', import.meta.url))
    workerRef.current = w
    w.onmessage = (e) => {
      const m = e.data
      if (m.type === 'ready') {
        setModel(m.model)
        setGrades(m.grades)
        setAlloys(new AlloyTable(m.grades))
        setCatalogueSize(m.nCatalogue)
        setStatus('ready')
        track('cm_loaded', { loadMs: m.loadMs, nCatalogue: m.nCatalogue })
      } else if (m.type === 'results') {
        setResult(m.results[0] ?? null)
        setElapsed(m.elapsedMs)
      } else if (m.type === 'catalogue-ready') {
        setCatalogueSize(m.nCatalogue)
      } else if (m.type === 'error') {
        setError(m.message)
        setStatus('error')
      }
    }
    w.postMessage({ type: 'init', base: BASE })
    fetch(`${BASE}/demo_rfq.json`)
      .then((r) => r.json())
      .then((rows: Record<string, unknown>[]) => {
        const parts = rows.map(toPart)
        setDemo(parts)
        setPart(parts[0])
      })
      .catch(() => setError('Could not load the demo parts.'))
    return () => w.terminate()
  }, [])

  // --- matching -------------------------------------------------------------
  const run = useCallback(
    (p: Part, m: 'enriched' | 'raw') => {
      const w = workerRef.current
      if (!w || status !== 'ready') return
      w.postMessage({ type: 'match', parts: [p], mode: m, k: 10 })
    },
    [status],
  )

  useEffect(() => {
    if (part && status === 'ready') run(part, mode)
  }, [part, mode, status, run])

  const update = (patch: Partial<Part>) => {
    setPart((p) => (p ? { ...p, ...patch } : p))
  }

  // --- uploads --------------------------------------------------------------
  const onUpload = async (file: File, kind: 'rfq' | 'history') => {
    if (!alloys) return
    try {
      const rows = await readSpreadsheet(file)
      if (rows.length === 0) {
        setUploadNote(`${file.name} had no readable rows. Check it has a header row.`)
        return
      }
      const { rows: enriched, usable, unusable, map } = enrichAll(rows, alloys, 'enriched')
      const parts = enriched.filter((r) => r.usable).map((r) => completePart(r.part))
      track('cm_upload', { kind, rows: rows.length, usable, unusable })

      if (kind === 'history') {
        if (parts.length < 20) {
          setUploadNote(
            `Read ${usable} usable rows from ${file.name}. A history needs at least 20 to match against — the sample catalogue is still in use.`,
          )
          return
        }
        workerRef.current?.postMessage({ type: 'catalogue', parts })
        setCatalogueSource('yours')
        setUploadNote(
          `Matching against your ${qty(parts.length)} quotes from ${file.name}. ${unusable > 0 ? `${unusable} rows were skipped — no dimensions or no recognisable material.` : 'Every row was readable.'}`,
        )
      } else {
        if (parts.length === 0) {
          setUploadNote(
            `Nothing in ${file.name} could be matched. Each row needs dimensions and a material.`,
          )
          return
        }
        setUploadedParts(parts)
        setPart(parts[0])
        setUploadNote(
          `Read ${qty(parts.length)} part${parts.length === 1 ? '' : 's'} from ${file.name}. Columns recognised: ${Object.keys(map).length}.${unusable > 0 ? ` ${unusable} row(s) skipped.` : ''}`,
        )
      }
    } catch (err) {
      setUploadNote(
        `Could not read ${file.name}: ${err instanceof Error ? err.message : 'unknown error'}`,
      )
    }
  }

  const resetCatalogue = () => {
    setCatalogueSource('sample')
    setUploadNote(null)
    workerRef.current?.postMessage({ type: 'init', base: BASE })
  }

  const bench = model?.benchmark

  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-8">
        <p className="font-display text-lg font-semibold text-white">
          The tool could not start.
        </p>
        <p className="mt-2 text-sm text-[var(--text-dim)]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-[var(--bg-raised)] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[var(--bg-card)]"
        >
          Reload the page
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* ---------- where the query comes from ---------- */}
      <div className="border-t border-[var(--line)] pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="inline-flex rounded-full border border-[var(--line-bright)] p-1">
            <TabButton active={tab === 'demo'} onClick={() => setTab('demo')}>
              A demo part
            </TabButton>
            <TabButton
              active={tab === 'upload'}
              onClick={() => {
                setTab('upload')
                track('cm_tab_upload')
              }}
            >
              Your own file
            </TabButton>
          </div>
          <p className="text-sm text-[var(--text-dim)]">
            {catalogueSource === 'sample' ? (
              <>Matching against {qty(catalogueSize)} sample quotes.</>
            ) : (
              <>
                Matching against your {qty(catalogueSize)} quotes.{' '}
                <button onClick={resetCatalogue} className="underline hover:text-white">
                  Use the sample again
                </button>
              </>
            )}
          </p>
        </div>

        {tab === 'demo' ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {demo.map((d) => (
              <button
                key={d.publicId}
                onClick={() => {
                  setPart(d)
                  track('cm_demo_part', { family: d.partFamily, grade: d.grade })
                }}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  part?.publicId === d.publicId
                    ? 'border-[var(--line-bright)] bg-[var(--bg-raised)] text-white'
                    : 'border-[var(--line-bright)] text-[var(--text-dim)] hover:border-[var(--line-bright)]'
                }`}
              >
                <span className="font-medium capitalize">{d.partFamily}</span>{' '}
                <span className="opacity-70">{d.grade}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <DropZone
              title="The part you are quoting"
              hint="CSV or Excel. One row per part, with a header row."
              onFile={(f) => onUpload(f, 'rfq')}
            />
            <DropZone
              title="Your own quote history"
              hint="Optional. Replaces the sample catalogue for this session."
              onFile={(f) => onUpload(f, 'history')}
            />
            {uploadedParts.length > 1 && (
              <div className="sm:col-span-2">
                <label className="block text-sm text-[var(--text-dim)]">
                  Part from your file
                  <select
                    className="mt-1 block w-full rounded-lg border border-[var(--line-bright)] px-3 py-2 text-white"
                    onChange={(e) => setPart(uploadedParts[Number(e.target.value)])}
                  >
                    {uploadedParts.map((p, i) => (
                      <option key={p.publicId + i} value={i}>
                        {p.publicId} — {p.partFamily} {p.grade}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {uploadNote && (
              <p className="sm:col-span-2 text-sm text-[var(--text-dim)]">{uploadNote}</p>
            )}
          </div>
        )}
      </div>

      {/* ---------- the query itself ---------- */}
      {part && (
        <div className="mt-10 border-t border-[var(--line)] pt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-white">
              Change anything here and the matches move
            </h2>
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <PartEditor part={part} grades={grades} onChange={update} />
        </div>
      )}

      {/* ---------- results ---------- */}
      {result && part && model && (
        <Results result={result} model={model} elapsed={elapsed} mode={mode} />
      )}

      {/* ---------- the numbers behind the tool ---------- */}
      {bench && <BenchmarkPanel bench={bench} />}
    </div>
  )
}

// --------------------------------------------------------------- controls ---

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? 'bg-[var(--bg-raised)] text-white' : 'text-[var(--text-dim)] hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'enriched' | 'raw'
  onChange: (m: 'enriched' | 'raw') => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex rounded-full border border-[var(--line-bright)] p-1">
        {(['raw', 'enriched'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              onChange(m)
              track('cm_mode', { mode: m })
            }}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${
              mode === m ? 'bg-[var(--bg-raised)] text-white' : 'text-[var(--text-dim)] hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="max-w-[22rem] text-xs leading-5 text-[var(--text-faint)]">
        {mode === 'enriched'
          ? 'Grades resolved to a material family, mass derived from the envelope, carbon estimated.'
          : 'Grade taken as a literal string, no density, no mass. What a tool without the alloy table can see.'}
      </p>
    </div>
  )
}

function DropZone({
  title,
  hint,
  onFile,
}: {
  title: string
  hint: string
  onFile: (f: File) => void
}) {
  const [over, setOver] = useState(false)
  const id = useMemo(() => `drop-${Math.random().toString(36).slice(2)}`, [])
  return (
    <label
      htmlFor={id}
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
      className={`block cursor-pointer rounded-2xl border border-dashed p-6 transition ${
        over ? 'border-[var(--blue-light)] bg-[var(--blue-light)]/5' : 'border-[var(--line-bright)] hover:border-[var(--blue)]'
      }`}
    >
      <p className="font-display font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-dim)]">{hint}</p>
      <p className="mt-3 text-sm font-medium text-[var(--blue-light)]">Choose a file or drop it here</p>
      <input
        id={id}
        type="file"
        accept=".csv,.tsv,.txt,.xlsx,.xls"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

// ----------------------------------------------------------------- editor ---

const FAMILIES = [
  'shaft',
  'bushing',
  'pin',
  'gear blank',
  'fitting',
  'flange',
  'bracket',
  'housing',
  'plate',
  'manifold',
]

function PartEditor({
  part,
  grades,
  onChange,
}: {
  part: Part
  grades: AlloyGrade[]
  onChange: (p: Partial<Part>) => void
}) {
  const rotational = part.shapeClass === 'rotational'
  return (
    <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Part family">
        <select
          value={part.partFamily}
          onChange={(e) => onChange({ partFamily: e.target.value })}
          className={inputClass}
        >
          {FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Material grade">
        <select
          value={part.grade}
          onChange={(e) => {
            const g = grades.find((x) => x.grade === e.target.value)
            onChange({ grade: e.target.value, alloyFamily: g?.family ?? part.alloyFamily })
          }}
          className={inputClass}
        >
          {grades.map((g) => (
            <option key={g.grade} value={g.grade}>
              {g.grade}
            </option>
          ))}
        </select>
      </Field>
      <Field label={rotational ? 'Diameter, mm' : 'Width, mm'}>
        <NumberInput value={part.envW} step={1} onChange={(v) => onChange(rotational ? { envW: v, envH: v } : { envW: v })} />
      </Field>
      <Field label="Length, mm">
        <NumberInput value={part.envL} step={1} onChange={(v) => onChange({ envL: v })} />
      </Field>
      {!rotational && (
        <Field label="Height, mm">
          <NumberInput value={part.envH} step={1} onChange={(v) => onChange({ envH: v })} />
        </Field>
      )}
      <Field label="Part mass, kg">
        <NumberInput value={part.partMassKg} step={0.01} onChange={(v) => onChange({ partMassKg: v })} />
      </Field>
      <Field label="Tightest tolerance, mm">
        <NumberInput value={part.tightestTolMm} step={0.005} onChange={(v) => onChange({ tightestTolMm: v })} />
      </Field>
      <Field label="Surface finish, Ra µm">
        <NumberInput value={part.surfaceRaUm} step={0.1} onChange={(v) => onChange({ surfaceRaUm: v })} />
      </Field>
      <Field label="Machined features">
        <NumberInput value={part.nFeatures} step={1} onChange={(v) => onChange({ nFeatures: Math.round(v) })} />
      </Field>
      <Field label="Setups">
        <NumberInput value={part.nSetups} step={1} onChange={(v) => onChange({ nSetups: Math.round(v) })} />
      </Field>
      <Field label="Batch quantity">
        <NumberInput value={part.batchQty} step={10} onChange={(v) => onChange({ batchQty: Math.max(1, Math.round(v)) })} />
      </Field>
      <Field label="Surface treatment">
        <select
          value={part.surfaceTreat}
          onChange={(e) => onChange({ surfaceTreat: e.target.value })}
          className={inputClass}
        >
          {['none', 'anodise', 'passivate', 'zinc', 'nitride', 'paint'].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

const inputClass =
  'mt-1 block w-full rounded-lg border border-[var(--line-bright)] bg-[var(--bg)] px-3 py-2 text-white tabular-nums focus:border-[var(--blue-light)] focus:ring-1 focus:ring-[var(--blue-light)] focus:outline-none'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--text-dim)]">{label}</span>
      {children}
    </label>
  )
}

function NumberInput({
  value,
  step,
  onChange,
}: {
  value: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      step={step}
      min={0}
      onChange={(e) => {
        const v = parseFloat(e.target.value)
        if (Number.isFinite(v) && v >= 0) onChange(v)
      }}
      className={inputClass}
    />
  )
}

// ---------------------------------------------------------------- results ---

function Results({
  result,
  model,
  elapsed,
  mode,
}: {
  result: MatchResult
  model: Model
  elapsed: number | null
  mode: 'enriched' | 'raw'
}) {
  useEffect(() => {
    track('cm_match_viewed', {
      mode,
      noPrecedent: result.noPrecedent,
      band: result.matches[0]?.band ?? 'none',
      pool: result.candidatePool,
    })
  }, [result, mode])

  if (result.noPrecedent) {
    return (
      <div className="mt-10 border-t border-[var(--line)] pt-8">
        <div className="rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-8">
          <h2 className="font-display text-2xl font-semibold text-white">
            No reliable precedent in this history
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--text-dim)]">
            The closest part in the catalogue is further away than anything the benchmark was
            measured on, so any price this tool showed you would be a guess dressed up as a
            number. {result.matches.length > 0 && (
              <>
                The nearest is {result.matches[0].part.publicId}, and the biggest gap is{' '}
                {result.matches[0].differences[0]?.detail}.
              </>
            )}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-dim)]">
            This is the tool working, not failing. Move the dimensions or the quantity closer to
            something that has been quoted before and the anchor comes back.
          </p>
        </div>
        {result.matches.length > 0 && (
          <>
            <h3 className="mt-10 font-display text-xl font-semibold text-white">
              The nearest parts anyway, without a price
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-dim)]">
              Shown so you can see how far off they are. Their prices are deliberately left out —
              averaging parts this different is how a quoting tool starts lying to you.
            </p>
            <MatchTable result={result} withPrices={false} />
          </>
        )}
      </div>
    )
  }

  const anchor = result.anchor
  const top = result.matches[0]

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      {/* price anchor */}
      {anchor && (
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-[var(--text-dim)]">
              Price anchor, from {result.matches.length} neighbours at a batch of{' '}
              {qty(result.query.batchQty)}
            </p>
            <p className="mt-2 font-display text-6xl font-medium tracking-tight text-white tabular-nums">
              {eur(anchor.point)}
            </p>
            <p className="mt-2 text-[var(--text-dim)] tabular-nums">
              {eur(anchor.low)} to {eur(anchor.high)}{' '}
              <span className="text-[var(--text-faint)]">
                — the 10th to 90th percentile of those neighbours
              </span>
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <Stat label="Closest match" value={`${pct(1 - top.distance, 1)} similar`} />
            <Stat label="Candidates searched" value={qty(result.candidatePool)} />
            {elapsed !== null && <Stat label="Time" value={`${elapsed} ms`} />}
            {result.carbonKgCo2e !== null && (
              <Stat
                label="Material carbon"
                value={`${result.carbonKgCo2e} kg CO₂e`}
                note="indicative"
              />
            )}
          </dl>
        </div>
      )}

      {result.relaxed && (
        <p className="mt-6 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 px-4 py-3 text-sm text-[var(--text-dim)]">
          Too few parts in this material and shape to rank properly, so the filter was widened.
          Treat the ranking below as weaker than the match bands suggest.
        </p>
      )}

      <MatchTable result={result} withPrices />

      <p className="mt-4 max-w-3xl text-sm text-[var(--text-dim)]">
        Historical prices are moved onto your quantity using the price–quantity slope fitted from
        this catalogue, and forward at 3% a year from the date they were quoted. Match bands come
        from the benchmark&apos;s distance percentiles, not from thresholds picked by hand.
      </p>

      {/* substitutions */}
      {result.substitutions.length > 0 && (
        <div className="mt-10 border-t border-[var(--line)] pt-8">
          <h3 className="font-display text-xl font-semibold text-white">
            Cheaper grades that are at least as strong
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-dim)]">
            Same material family, tensile strength no lower than {result.query.grade}. Whether they
            are allowed on this part is a question for the drawing, not for this tool.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {result.substitutions.map((s) => (
              <li key={s.grade} className="rounded-xl border border-[var(--line)] p-4">
                <p className="font-medium text-white">{s.grade}</p>
                <p className="mt-1 text-sm text-[var(--text-dim)] tabular-nums">
                  {s.uts} MPa, €{s.eurKg.toFixed(2)}/kg
                </p>
                <p className="mt-2 text-sm text-[var(--blue-light)] tabular-nums">
                  {s.savesEurPerKg > 0 && <>€{s.savesEurPerKg.toFixed(2)}/kg cheaper</>}
                  {s.savesEurPerKg > 0 && s.savesCo2PerKg > 0 && ', '}
                  {s.savesCo2PerKg > 0 && <>{s.savesCo2PerKg.toFixed(1)} kg CO₂e/kg lower</>}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MatchTable({ result, withPrices }: { result: MatchResult; withPrices: boolean }) {
  return (
    <div className="mt-10 overflow-x-auto">
      <table className="w-full min-w-[54rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--line-bright)] text-left align-bottom">
            <Th className="w-8">#</Th>
            <Th>Quote</Th>
            <Th>Grade</Th>
            <Th className="text-right whitespace-nowrap">Size, mm</Th>
            <Th className="text-right">Batch</Th>
            {withPrices && <Th className="text-right">Quoted</Th>}
            {withPrices && <Th className="text-right whitespace-nowrap">At your quantity</Th>}
            <Th className="text-right">Match</Th>
          </tr>
        </thead>
        <tbody>
          {result.matches.map((m) => {
            const style = BAND_STYLE[m.band]
            return (
              <tr key={m.part.publicId} className="border-b border-[var(--line)] align-top">
                <Td className="py-4 text-[var(--text-faint)] tabular-nums">{m.rank}</Td>
                <Td className="py-4">
                  <span className="font-medium text-white">{m.part.publicId}</span>
                  <span className="block text-[var(--text-faint)]">
                    {m.part.partFamily}, {shortDate(m.part.quoteDate)}
                    {m.part.won ? ', won' : ', lost'}
                  </span>
                  <span className="mt-2 block max-w-md text-[var(--text-dim)]">
                    {m.differences.map((d) => d.detail).filter(Boolean).join(' · ')}
                  </span>
                </Td>
                <Td className="py-4 whitespace-nowrap text-[var(--text-dim)]">{m.part.grade}</Td>
                <Td className="py-4 text-right whitespace-nowrap text-[var(--text-dim)] tabular-nums">
                  {dims(m.part.envL, m.part.envW, m.part.envH, m.part.shapeClass === 'rotational')}
                </Td>
                <Td className="py-4 text-right text-[var(--text-dim)] tabular-nums">
                  {qty(m.part.batchQty)}
                </Td>
                {withPrices && (
                  <Td className="py-4 text-right text-[var(--text-faint)] tabular-nums">
                    {eur(m.part.unitPriceEur)}
                  </Td>
                )}
                {withPrices && (
                  <Td className="py-4 text-right font-medium text-white tabular-nums">
                    {eur(m.adjustedPriceEur)}
                  </Td>
                )}
                <Td className="py-4">
                  <span className="flex items-center justify-end gap-2 whitespace-nowrap">
                    <span className={style.text}>{style.label}</span>
                    <span className={`h-5 w-1 rounded-full ${style.rule}`} aria-hidden="true" />
                  </span>
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BandLegend({ model }: { model: Model }) {
  const p = model.bandPrecision
  const rows: [string, number][] = [
    ['High', p.high],
    ['Medium', p.medium],
    ['Low', p.low],
  ]
  return (
    <p className="mt-4 max-w-3xl text-sm text-[var(--text-dim)]">
      Bands are calibrated on the benchmark, not picked by hand:{' '}
      {rows.map(([label, v], i) => (
        <span key={label}>
          {i > 0 && (i === rows.length - 1 ? ' and ' : ', ')}
          <span className={BAND_STYLE[label.toUpperCase()].text}>{label.toLowerCase()}</span> means{' '}
          <span className="tabular-nums">{pct(v, 0)}</span> of neighbours that close turn out to be
          the same design
        </span>
      ))}
      .
    </p>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-[var(--text-faint)]">{label}</dt>
      <dd className="mt-1 font-medium text-white tabular-nums">
        {value}
        {note && <span className="ml-1 font-normal text-[var(--text-faint)]">{note}</span>}
      </dd>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`pr-6 pb-3 font-medium text-[var(--text-faint)] last:pr-0 ${className}`}>{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`pr-6 last:pr-0 ${className}`}>{children}</td>
}

// -------------------------------------------------------------- benchmark ---

function BenchmarkPanel({ bench }: { bench: Benchmark }) {
  return (
    <div className="mt-16 border-t border-[var(--line)] pt-8">
      <h2 className="font-display text-xl font-semibold text-white">
        What these numbers were measured on
      </h2>
      <p className="mt-3 max-w-3xl text-[var(--text-dim)]">
        {qty(bench.nQueries)} parts were held out of the catalogue entirely. Each one has siblings
        in the remaining {qty(bench.nCatalogue)} quotes that the engine cannot see and was never
        tuned on. Recall is the share of those siblings it puts in the top ten.
      </p>
      <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        <Measure
          value={pct(bench.recallAt10)}
          label="recall@10"
          note={`${pct(bench.recallAt10Untuned)} before the weights were tuned`}
        />
        <Measure
          value={`±${pct(bench.priceMedape)}`}
          label="median price error"
          note={`the regression baseline manages ±${pct(bench.naiveMedape)}`}
        />
        <Measure
          value={pct(bench.priceRangeCoverage)}
          label="of prices fall inside the stated range"
          note="the range is built to cover 80%"
        />
        <Measure
          value={`+${bench.messy.enrichment_gain_points.toFixed(1)}`}
          label="points of recall from enrichment"
          note={`${pct(bench.messy.recall_raw)} raw against ${pct(bench.messy.recall_enriched)} enriched, on deliberately messy input`}
        />
      </dl>
      <p className="mt-8 max-w-3xl text-sm text-[var(--text-dim)]">
        Mean price error is ±{pct(bench.priceMape)}, pulled up by a small number of parts with very
        few close neighbours; the median is the fairer number and both are here. A looser
        definition of recall — did any sibling at all reach the top ten — scores{' '}
        {pct(bench.hitAt10)}, which is why it is not the one on the headline.
      </p>
    </div>
  )
}

function Measure({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="border-t border-[var(--line-bright)] pt-4">
      <dd className="font-display text-4xl font-medium text-white tabular-nums">{value}</dd>
      <dt className="mt-2 text-white">{label}</dt>
      <p className="mt-1 text-sm text-[var(--text-faint)]">{note}</p>
    </div>
  )
}

// ------------------------------------------------------------------ utils ---

function toPart(r: Record<string, unknown>): Part {
  const n = (k: string, d = 0) => {
    const v = Number(r[k])
    return Number.isFinite(v) ? v : d
  }
  const s = (k: string, d = '') => (r[k] === undefined || r[k] === null ? d : String(r[k]))
  return {
    publicId: s('public_id', 'demo'),
    partFamily: s('part_family', 'bracket'),
    shapeClass: (s('shape_class', 'prismatic') as Part['shapeClass']) ?? 'prismatic',
    grade: s('grade'),
    alloyFamily: s('alloy_family'),
    process: s('process', '3-axis mill'),
    envL: n('env_l_mm'),
    envW: n('env_w_mm'),
    envH: n('env_h_mm'),
    stockMassKg: n('stock_mass_kg'),
    partMassKg: n('part_mass_kg'),
    nFeatures: n('n_features', 12),
    nSetups: n('n_setups', 2),
    tightestTolMm: n('tightest_tol_mm', 0.05),
    surfaceRaUm: n('surface_Ra_um', 3.2),
    heatTreat: s('heat_treat', 'none'),
    surfaceTreat: s('surface_treat', 'none'),
    annualQty: n('annual_qty', 1000),
    batchQty: n('batch_qty', 100),
    quoteDate: s('quote_date', new Date().toISOString().slice(0, 10)),
    unitPriceEur: n('unit_price_eur'),
    won: false,
  }
}

function completePart(p: Partial<Part>): Part {
  return {
    publicId: p.publicId ?? 'row',
    partFamily: p.partFamily ?? 'bracket',
    shapeClass: p.shapeClass ?? 'prismatic',
    grade: p.grade ?? '',
    alloyFamily: p.alloyFamily ?? '',
    process: p.process ?? '3-axis mill',
    envL: p.envL ?? 0,
    envW: p.envW ?? 0,
    envH: p.envH ?? 0,
    stockMassKg: p.stockMassKg ?? 0,
    partMassKg: p.partMassKg ?? 0,
    nFeatures: p.nFeatures ?? 12,
    nSetups: p.nSetups ?? 2,
    tightestTolMm: p.tightestTolMm ?? 0.05,
    surfaceRaUm: p.surfaceRaUm ?? 3.2,
    heatTreat: p.heatTreat ?? 'none',
    surfaceTreat: p.surfaceTreat ?? 'none',
    annualQty: p.annualQty ?? 1000,
    batchQty: p.batchQty ?? 100,
    quoteDate: p.quoteDate ?? new Date().toISOString().slice(0, 10),
    unitPriceEur: p.unitPriceEur ?? 0,
    won: p.won ?? false,
  }
}
