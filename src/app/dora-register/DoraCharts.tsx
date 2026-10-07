'use client'

import { useState } from 'react'

// Figures specific to the register checker. Same rules as Charts.tsx: one
// accent blue carries the measure, an inert grey carries the comparison or
// the "all" total, text wears text tokens, axes stay recessive.

const ACCENT = '#3b82f6'
const INERT = '#64748b'

const widthOf = (text: string, px: number) => text.length * px * 0.58

/** SVG text does not wrap or ellipsise, so long taxonomy labels ("ICT, facilities
 *  and hosting services (excluding Cloud services)") ran under their own bars. */
const clip = (s: string, max = 34) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s)

/** A total with a highlighted part: service rows per type, critical rows on top. */
export function PartOfWhole({
  rows,
  caption,
  partLabel = 'critical',
}: {
  rows: { label: string; total: number; part: number }[]
  caption?: string
  partLabel?: string
}) {
  rows = rows.map((r) => ({ ...r, label: clip(r.label) }))
  const max = Math.max(...rows.map((r) => r.total)) || 1
  const barH = 22
  const gap = 10
  const h = rows.length * (barH + gap) - gap
  const labelW = Math.min(Math.max(...rows.map((r) => widthOf(r.label, 11)), 60) + 10, 230)
  const valueW = 110
  const barArea = 220
  const W = labelW + barArea + valueW
  return (
    <figure className="mt-5">
      <svg viewBox={`0 0 ${W} ${h}`} className="w-full" role="img" aria-label={caption ?? 'Rows by type'}>
        {rows.map((r, i) => {
          const y = i * (barH + gap)
          const w = Math.max((r.total / max) * barArea, 2)
          const wp = (r.part / max) * barArea
          return (
            <g key={r.label}>
              <text x={0} y={y + barH / 2 + 4} className="fill-[var(--text-dim)] text-[11px]">
                {r.label}
              </text>
              <rect x={labelW} y={y + 4} width={w} height={barH - 8} rx={3} fill={INERT} opacity={0.45} />
              {wp > 0 && <rect x={labelW} y={y + 4} width={Math.max(wp, 2)} height={barH - 8} rx={3} fill={ACCENT} />}
              <text x={labelW + w + 8} y={y + barH / 2 + 4} className="fill-white text-[11px] font-medium tabular-nums">
                {r.total}
                <tspan className="fill-[var(--text-faint)]"> · {r.part} {partLabel}</tspan>
              </text>
            </g>
          )
        })}
      </svg>
      {caption && <figcaption className="mt-3 text-xs leading-5 text-[var(--text-faint)]">{caption}</figcaption>}
    </figure>
  )
}

/** Two rates per category: the EU figure (inert) and this register (accent). */
export function PairedRates({
  rows,
  caption,
  leftLabel,
  rightLabel,
}: {
  rows: { label: string; left: number; right: number | null; note?: string }[]
  caption?: string
  leftLabel: string
  rightLabel: string
}) {
  rows = rows.map((r) => ({ ...r, label: clip(r.label, 36) }))
  const barH = 12
  const pairGap = 3
  const gap = 14
  const rowH = barH * 2 + pairGap
  const h = rows.length * (rowH + gap) - gap + 18
  const labelW = Math.min(Math.max(...rows.map((r) => widthOf(r.label, 11)), 60) + 10, 230)
  const barArea = 220
  const valueW = 120
  const W = labelW + barArea + valueW
  return (
    <figure className="mt-5">
      <div className="flex gap-5 text-xs text-[var(--text-faint)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm" style={{ background: INERT }} /> {leftLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm" style={{ background: ACCENT }} /> {rightLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${h}`} className="mt-3 w-full" role="img" aria-label={caption ?? 'Comparison'}>
        {rows.map((r, i) => {
          const y = i * (rowH + gap)
          const wl = Math.max(r.left * barArea, 2)
          const wr = r.right === null ? 0 : Math.max(r.right * barArea, 2)
          return (
            <g key={r.label}>
              <text x={0} y={y + rowH / 2 + 4} className="fill-[var(--text-dim)] text-[11px]">
                {r.label}
              </text>
              <rect x={labelW} y={y} width={wl} height={barH} rx={2} fill={INERT} opacity={0.6} />
              <text x={labelW + wl + 6} y={y + barH - 2} className="fill-[var(--text-faint)] text-[10px] tabular-nums">
                {Math.round(r.left * 100)}%
              </text>
              {r.right === null ? (
                <text x={labelW + 6} y={y + barH + pairGap + barH - 2} className="fill-[var(--text-faint)] text-[10px]">
                  none in this register
                </text>
              ) : (
                <>
                  <rect x={labelW} y={y + barH + pairGap} width={wr} height={barH} rx={2} fill={ACCENT} />
                  <text x={labelW + wr + 6} y={y + barH + pairGap + barH - 2} className="fill-white text-[10px] font-medium tabular-nums">
                    {Math.round(r.right * 100)}%{r.note ? ` (${r.note})` : ''}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>
      {caption && <figcaption className="mt-3 text-xs leading-5 text-[var(--text-faint)]">{caption}</figcaption>}
    </figure>
  )
}

/** Contracts on a time axis. Open-ended arrangements run to the right edge. */
export function ContractTimeline({
  contracts,
  refDate,
  caption,
}: {
  contracts: { ref: string; start: string; end: string; critical: boolean; label: string }[]
  refDate: string
  caption?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const dated = contracts.filter((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.start)).sort((a, b) => a.start.localeCompare(b.start))
  if (dated.length === 0) return null
  const toT = (d: string) => new Date(d).getTime()
  const ref = toT(/^\d{4}-\d{2}-\d{2}$/.test(refDate) ? refDate : new Date().toISOString().slice(0, 10))
  const minT = Math.min(...dated.map((c) => toT(c.start)))
  const maxT = Math.max(ref, ...dated.map((c) => (c.end && c.end !== '9999-12-31' ? toT(c.end) : ref)))
  const span = Math.max(1, maxT - minT)
  // The viewBox is wide on purpose: this figure spans the whole column, and a
  // narrow viewBox scaled to it turns 10px labels into 35px ones.
  const rowH = 16
  const gap = 6
  const labelW = Math.min(Math.max(...dated.map((c) => widthOf(c.ref, 10)), 50) + 10, 170)
  const area = 760
  const W = labelW + area + 20
  const H = dated.length * (rowH + gap) + 18
  const x = (t: number) => labelW + ((t - minT) / span) * area
  const years: number[] = []
  for (let y = new Date(minT).getUTCFullYear(); y <= new Date(maxT).getUTCFullYear(); y++) years.push(y)
  return (
    <figure className="mt-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: Math.min(H * 1.6, 520) }} role="img" aria-label={caption ?? 'Contract timeline'}>
        {years.map((y) => {
          const t = Date.UTC(y, 0, 1)
          if (t < minT || t > maxT) return null
          return (
            <g key={y}>
              <line x1={x(t)} x2={x(t)} y1={0} y2={H - 18} stroke="var(--line)" strokeWidth={1} />
              <text x={x(t) + 3} y={H - 5} className="fill-[var(--text-faint)] text-[9px]">
                {y}
              </text>
            </g>
          )
        })}
        <line x1={x(ref)} x2={x(ref)} y1={0} y2={H - 18} stroke="var(--blue-light)" strokeWidth={1} strokeDasharray="3 3" />
        {dated.map((c, i) => {
          const y = i * (rowH + gap)
          const s = toT(c.start)
          const open = !c.end || c.end === '9999-12-31'
          const e = open ? maxT : Math.max(toT(c.end), s)
          const x0 = x(s)
          const x1 = x(e)
          const ended = !open && e <= ref
          return (
            <g key={c.ref} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <text x={0} y={y + rowH / 2 + 3} className="fill-[var(--text-dim)] text-[10px]">
                {c.ref}
              </text>
              <rect
                x={x0}
                y={y + 3}
                width={Math.max(x1 - x0, 2)}
                height={rowH - 6}
                rx={2}
                fill={c.critical ? ACCENT : INERT}
                opacity={ended ? 0.35 : hover === i ? 1 : 0.85}
              />
              {open && <polygon points={`${x1},${y + 3} ${x1 + 6},${y + rowH / 2} ${x1},${y + rowH - 3}`} fill={c.critical ? ACCENT : INERT} opacity={0.85} />}
              {hover === i && (
                <text x={Math.min(x0, W - 200)} y={y - 2} className="fill-white text-[9px]">
                  {c.label} · {c.start} → {open ? 'open-ended' : c.end}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {caption && <figcaption className="mt-3 text-xs leading-5 text-[var(--text-faint)]">{caption}</figcaption>}
    </figure>
  )
}
