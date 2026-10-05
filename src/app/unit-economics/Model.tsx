'use client'

import { useMemo, useState } from 'react'

import { track } from '@/lib/track'

import { SensitivityLine } from '@/components/Charts'
import {
  evaluate,
  forecast,
  PRESETS,
  sensitivity,
  type Model as EconModel,
} from '@/lib/unit-economics'

// The calculator. Break-even arithmetic is the easy part and is shown without
// ceremony; the sensitivity table underneath it is the reason the page exists,
// because it answers the question people actually have — which of these numbers
// do I need to be right about.

const fmt = (v: number, cur: string, dp = 0) =>
  `${cur}${v.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
const num = (v: number, dp = 0) =>
  v.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp })
const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`

export function UnitEconomics() {
  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const preset = PRESETS.find((p) => p.id === presetId)!
  const [m, setM] = useState<EconModel>(preset.model)
  const [history, setHistory] = useState<number[]>(preset.history)
  const [swing, setSwing] = useState(0.2)

  const choose = (id: string) => {
    const p = PRESETS.find((x) => x.id === id)!
    track('economics_preset', { preset: id })
    setPresetId(id)
    setM(p.model)
    setHistory(p.history)
  }

  const r = useMemo(() => evaluate(m), [m])
  const sens = useMemo(() => sensitivity(m, swing), [m, swing])
  const fc = useMemo(() => forecast(history, 6), [history])

  const set = (patch: Partial<EconModel>) => setM((x) => ({ ...x, ...patch }))
  const setCost = (i: number, v: number) =>
    setM((x) => ({
      ...x,
      variableCosts: x.variableCosts.map((c, j) => (j === i ? { ...c, perUnit: v } : c)),
    }))

  const maxSwing = Math.max(...sens.map((s) => s.swing), 1)

  return (
    <div>
      {/* ------------------------------------------------------ presets --- */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => choose(p.id)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              presetId === p.id
                ? 'border-[var(--blue)] bg-[var(--blue)] text-white'
                : 'border-[var(--line-bright)] text-[var(--text-dim)] hover:border-[var(--blue)] hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{preset.note}</p>

      {/* ------------------------------------------------------- headline --- */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          value={fmt(r.contributionPerUnit, m.currency, 2)}
          label={`contribution per ${m.unitName}`}
          accent={r.contributionPerUnit > 0}
          warn={r.contributionPerUnit <= 0}
        />
        <Tile value={pct(r.contributionRatio)} label="contribution margin" />
        <Tile
          value={r.breakEvenVolume === null ? '—' : num(Math.ceil(r.breakEvenVolume))}
          label={`break-even ${m.unitPlural} per ${m.periodName}`}
          warn={r.impossible}
        />
        <Tile
          value={fmt(r.profit, m.currency)}
          label={`profit per ${m.periodName}`}
          accent={r.profit > 0}
          warn={r.profit <= 0}
        />
      </div>

      {r.impossible && (
        <p className="mt-6 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b]/5 px-5 py-4 text-sm text-[var(--text-dim)]">
          Every {m.unitName} sold loses money before a penny of fixed cost is covered, so there is
          no volume that breaks even. Volume is not the problem here and no amount of growth fixes
          it — the price or the variable cost has to move.
        </p>
      )}

      {r.marginOfSafety !== null && !r.impossible && (
        <p className="mt-6 text-sm text-[var(--text-dim)]">
          {r.marginOfSafety >= 0 ? (
            <>
              Volume can fall{' '}
              <span className="text-white tabular-nums">{pct(r.marginOfSafety)}</span> before this
              stops breaking even
              {r.capacityUtilisation !== null && (
                <>
                  , and you are running at{' '}
                  <span className="text-white tabular-nums">{pct(r.capacityUtilisation)}</span> of
                  capacity
                </>
              )}
              .
            </>
          ) : (
            <>
              Volume is{' '}
              <span className="text-[#f59e0b] tabular-nums">{pct(Math.abs(r.marginOfSafety))}</span>{' '}
              short of break-even.
            </>
          )}
        </p>
      )}

      {/* --------------------------------------------------------- inputs --- */}
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">The inputs</h2>
          <div className="mt-6 space-y-4">
            <Field label={`Price per ${m.unitName}`} prefix={m.currency}>
              <Num value={m.pricePerUnit} step={0.5} onChange={(v) => set({ pricePerUnit: v })} />
            </Field>
            {m.variableCosts.map((c, i) => (
              <Field key={c.id} label={c.name} prefix={m.currency}>
                <Num value={c.perUnit} step={0.5} onChange={(v) => setCost(i, v)} />
              </Field>
            ))}
            <Field label={`Fixed costs per ${m.periodName}`} prefix={m.currency}>
              <Num
                value={m.fixedCostsPerPeriod}
                step={250}
                onChange={(v) => set({ fixedCostsPerPeriod: v })}
              />
            </Field>
            <Field label={`${m.unitPlural} per ${m.periodName}`}>
              <Num
                value={m.volumePerPeriod}
                step={10}
                onChange={(v) => set({ volumePerPeriod: v })}
              />
            </Field>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Where the money goes, per {m.unitName}
          </h2>
          <div className="mt-6 space-y-3">
            {m.variableCosts.map((c) => {
              const share = m.pricePerUnit > 0 ? c.perUnit / m.pricePerUnit : 0
              return (
                <div key={c.id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[var(--text-dim)]">{c.name}</span>
                    <span className="text-white tabular-nums">
                      {fmt(c.perUnit, m.currency, 2)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--line)]">
                    <div
                      className="h-1.5 rounded-full bg-[#64748b]"
                      style={{ width: `${Math.min(share * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="border-t border-[var(--line)] pt-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-white">Contribution</span>
                <span className="text-[var(--blue-light)] tabular-nums">
                  {fmt(r.contributionPerUnit, m.currency, 2)}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--line)]">
                <div
                  className="h-1.5 rounded-full bg-[#3b82f6]"
                  style={{ width: `${Math.max(Math.min(r.contributionRatio * 100, 100), 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- sensitivity --- */}
      <div className="mt-16 border-t border-[var(--line)] pt-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Which assumption the answer turns on
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-dim)]">
              Each input moved down and up by the same amount, everything else held still. The
              order is the finding: argue about the top row, and stop arguing about the bottom one.
            </p>
          </div>
          <label className="text-sm text-[var(--text-dim)]">
            Move each input by
            <select
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="ml-2 rounded-lg border border-[var(--line-bright)] bg-[var(--bg)] px-2 py-1 text-white"
            >
              {[0.05, 0.1, 0.2, 0.3].map((v) => (
                <option key={v} value={v}>
                  ±{v * 100}%
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-8 space-y-4">
          {sens.map((s) => (
            <div key={s.input}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="text-white">{s.input}</span>
                <span className="text-[var(--text-dim)] tabular-nums">
                  {fmt(s.low, m.currency)} to {fmt(s.high, m.currency)}
                  {s.breakEvenValue !== null && (
                    <span className="ml-3 text-[var(--text-faint)]">
                      breaks even at {num(s.breakEvenValue, 2)}
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[var(--line)]">
                <div
                  className="h-2 rounded-full bg-[#3b82f6]"
                  style={{ width: `${(s.swing / maxSwing) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------- forecast --- */}
      <div className="mt-16 border-t border-[var(--line)] pt-10">
        <h2 className="font-display text-xl font-semibold text-white">
          Where volume is heading, and how sure that is
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">
          Twelve periods of history, six projected. The band is the part worth looking at: it
          comes from the model&apos;s own errors on the history it has already seen, so a series
          that has been erratic produces a visibly wide band rather than a confident line.
        </p>

        {fc.usable && (
          <>
            <SensitivityLine
              points={[
                ...history.map((v, i) => ({ x: i + 1, y: v })),
                ...fc.points.map((p) => ({ x: p.period, y: p.value })),
              ]}
              xLabel={m.periodName}
              yLabel={m.unitPlural}
              markerAt={history.length}
              caption={`${fc.method}. Average one-step error on the history: ${num(fc.mae)} ${m.unitPlural}.`}
            />
            <dl className="mt-6 grid gap-6 sm:grid-cols-3">
              <Tile
                value={num(Math.round(fc.points[fc.points.length - 1].value))}
                label={`central projection, ${m.periodName} ${fc.points[fc.points.length - 1].period}`}
              />
              <Tile
                value={`${num(Math.round(fc.points[fc.points.length - 1].low))} – ${num(
                  Math.round(fc.points[fc.points.length - 1].high),
                )}`}
                label="95% interval by then"
              />
              <Tile
                value={
                  r.breakEvenVolume === null
                    ? '—'
                    : fc.points.filter((p) => p.low >= (r.breakEvenVolume ?? 0)).length > 0
                      ? 'Yes'
                      : 'Not certainly'
                }
                label="clears break-even even at the bottom of the interval"
                accent={
                  r.breakEvenVolume !== null &&
                  fc.points.some((p) => p.low >= (r.breakEvenVolume ?? 0))
                }
              />
            </dl>
          </>
        )}

        <p className="mt-6 max-w-3xl text-sm leading-6 text-[var(--text-faint)]">
          What this cannot do: anticipate a contract starting or ending, a price change, a
          competitor, or a season it has never seen. It extrapolates the shape of the past. Every
          forecast does, and the ones that do not say so are the ones to distrust.
        </p>
      </div>
    </div>
  )
}

function Tile({
  value,
  label,
  accent,
  warn,
}: {
  value: string
  label: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className="border-t border-[var(--line-bright)] pt-4">
      <dd
        className={`font-display text-2xl font-medium tabular-nums sm:text-3xl ${
          warn ? 'text-[#f59e0b]' : accent ? 'text-[var(--blue-light)]' : 'text-white'
        }`}
      >
        {value}
      </dd>
      <dt className="mt-1 text-sm leading-5 text-[var(--text-faint)]">{label}</dt>
    </div>
  )
}

function Field({
  label,
  prefix,
  children,
}: {
  label: string
  prefix?: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--text-dim)]">{label}</span>
      <span className="mt-1 flex items-center gap-2">
        {prefix && <span className="text-[var(--text-faint)]">{prefix}</span>}
        {children}
      </span>
    </label>
  )
}

function Num({
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
      className="w-full rounded-lg border border-[var(--line-bright)] bg-[var(--bg)] px-3 py-2 text-white tabular-nums focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] focus:outline-none"
    />
  )
}
