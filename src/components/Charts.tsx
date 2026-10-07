'use client'

import { useId, useState } from 'react'

// Inline SVG rather than a charting library: these are small, fixed-shape
// figures inside cards, and a library would cost more kilobytes than the whole
// rest of the page.
//
// Colour rules, applied throughout:
//   · one accent blue carries the measure; nothing competes with it
//   · a "before" state is deliberately grey — it should read as inert
//   · numbers and labels wear text tokens, never the series colour, so the
//     coloured mark alone carries identity
//   · axes and grid stay recessive

const ACCENT = '#3b82f6'
const ACCENT_BRIGHT = '#60a5fa'
const INERT = '#64748b'
const GRID = 'var(--line)'

// ---------------------------------------------------------------- compare ---

export interface ComparePoint {
  label: string
  value: number
  state?: 'before' | 'after'
  display?: string
}

/** Two states of one measure. Paired bars beat a slope chart here because the
 *  magnitudes matter as much as the direction of travel.
 *
 *  The geometry is derived from the content rather than fixed. With a fixed
 *  label column and a fixed 340-unit canvas, a long category name ran under
 *  its own bar and the value beside the longest bar fell off the right-hand
 *  edge and was clipped — "230 in 49 countries" rendered as "230 in 49". SVG
 *  does not wrap or ellipsise text, so the canvas has to be told how much room
 *  the text needs. */
export function CompareBars({
  points,
  caption,
  unit = '',
}: {
  points: ComparePoint[]
  caption?: string
  unit?: string
}) {
  const max = Math.max(...points.map((p) => p.value)) || 1
  const barH = 34
  const gap = 12
  const h = points.length * (barH + gap) - gap

  const LABEL_PX = 11
  const VALUE_PX = 12
  // A rough advance width per character. Mona Sans is proportional, so this is
  // an estimate; it only has to be generous enough that nothing is cut off.
  const widthOf = (text: string, px: number) => text.length * px * 0.58

  const valueText = (p: ComparePoint) =>
    `${p.display ?? p.value.toLocaleString('en-GB')}${unit}`

  const labelW = Math.min(
    Math.max(...points.map((p) => widthOf(p.label, LABEL_PX)), 56) + 10,
    190,
  )
  const valueW = Math.max(...points.map((p) => widthOf(valueText(p), VALUE_PX)), 28) + 12
  const barArea = 200
  const W = labelW + barArea + valueW

  return (
    <figure className="mt-6">
      <svg
        viewBox={`0 0 ${W} ${h}`}
        className="w-full"
        role="img"
        aria-label={caption ?? 'Comparison'}
      >
        {points.map((p, i) => {
          const y = i * (barH + gap)
          const w = Math.max((p.value / max) * barArea, 3)
          const isAfter = p.state !== 'before'
          return (
            <g key={p.label}>
              <text
                x={0}
                y={y + barH / 2 + 4}
                className="fill-[var(--text-dim)] text-[11px]"
              >
                {p.label}
              </text>
              <rect
                x={labelW}
                y={y + 7}
                width={w}
                height={barH - 14}
                rx={4}
                fill={isAfter ? ACCENT : INERT}
              />
              <text
                x={labelW + w + 8}
                y={y + barH / 2 + 4}
                className="fill-white text-[12px] font-medium tabular-nums"
              >
                {valueText(p)}
              </text>
            </g>
          )
        })}
      </svg>
      {caption && (
        <figcaption className="mt-3 text-xs leading-5 text-[var(--text-faint)]">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

// ------------------------------------------------------------ sensitivity ---

export interface SeriesPoint {
  x: number
  y: number
}

/** One measure against one continuous input. A single series, so no legend —
 *  the caption names it. Hover reads out the exact pair. */
export function SensitivityLine({
  points,
  xLabel,
  yLabel,
  caption,
  markerAt,
  formatX = (v: number) => String(v),
  formatY = (v: number) => String(v),
}: {
  points: SeriesPoint[]
  xLabel: string
  yLabel: string
  caption?: string
  markerAt?: number
  formatX?: (v: number) => string
  formatY?: (v: number) => string
}) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)

  const W = 340
  const H = 150
  const padL = 40
  const padB = 26
  const padT = 10
  const padR = 8

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = 0
  const y1 = Math.max(...ys) * 1.08

  const sx = (v: number) => padL + ((v - x0) / (x1 - x0 || 1)) * (W - padL - padR)
  const sy = (v: number) => H - padB - ((v - y0) / (y1 - y0 || 1)) * (H - padB - padT)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x)},${sy(p.y)}`).join(' ')
  const area = `${path} L${sx(points[points.length - 1].x)},${H - padB} L${sx(points[0].x)},${H - padB} Z`

  // Raw tick values are whatever the data range divides into, e.g. 146.690230…;
  // a label that long runs off the left edge. Three significant figures is
  // enough to read an axis by.
  const ticks = [0, 0.5, 1].map((f) => Number((y0 + f * (y1 - y0)).toPrecision(3)))
  const active = hover !== null ? points[hover] : null

  return (
    <figure className="mt-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={caption ?? `${yLabel} against ${xLabel}`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} stroke={GRID} strokeWidth="1" />
            <text
              x={padL - 6}
              y={sy(t) + 3}
              textAnchor="end"
              className="fill-[var(--text-faint)] text-[9px] tabular-nums"
            >
              {formatY(t)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${id}-fill)`} />
        <path d={path} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />

        {markerAt !== undefined && (
          <line
            x1={sx(markerAt)}
            x2={sx(markerAt)}
            y1={padT}
            y2={H - padB}
            stroke={ACCENT_BRIGHT}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}

        {active && (
          <>
            <line
              x1={sx(active.x)}
              x2={sx(active.x)}
              y1={padT}
              y2={H - padB}
              stroke={ACCENT_BRIGHT}
              strokeWidth="1"
            />
            <circle
              cx={sx(active.x)}
              cy={sy(active.y)}
              r="4.5"
              fill={ACCENT_BRIGHT}
              stroke="var(--bg-card)"
              strokeWidth="2"
            />
          </>
        )}

        {/* Hit targets wider than the marks. */}
        {points.map((p, i) => (
          <rect
            key={p.x}
            x={sx(p.x) - (W - padL - padR) / points.length / 2}
            y={padT}
            width={(W - padL - padR) / points.length}
            height={H - padB - padT}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke={GRID} strokeWidth="1" />
        <text
          x={padL}
          y={H - 6}
          className="fill-[var(--text-faint)] text-[9px] tabular-nums"
        >
          {formatX(x0)}
        </text>
        <text
          x={W - padR}
          y={H - 6}
          textAnchor="end"
          className="fill-[var(--text-faint)] text-[9px] tabular-nums"
        >
          {formatX(x1)}
        </text>
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-3 text-xs leading-5 text-[var(--text-faint)]">
        {active ? (
          <span className="text-[var(--text-dim)] tabular-nums">
            {formatX(active.x)} {xLabel} → {formatY(active.y)} {yLabel}
          </span>
        ) : (
          caption
        )}
      </figcaption>
    </figure>
  )
}

// -------------------------------------------------------------- histogram ---

/** A distribution. One series, so the bars share one colour; the highlighted
 *  bin is the only thing that changes weight. */
export function Histogram({
  bins,
  caption,
  highlightIndex,
  xLabel,
}: {
  bins: { label: string; count: number }[]
  caption?: string
  highlightIndex?: number
  xLabel?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...bins.map((b) => b.count)) || 1
  const W = 340
  const H = 128
  const padB = 22
  const gap = 2
  const bw = (W - gap * (bins.length - 1)) / bins.length

  const active = hover !== null ? bins[hover] : null

  return (
    <figure className="mt-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={caption ?? 'Distribution'}
        onMouseLeave={() => setHover(null)}
      >
        {bins.map((b, i) => {
          const h = Math.max((b.count / max) * (H - padB - 6), 2)
          const x = i * (bw + gap)
          const isHot = hover === i || (hover === null && highlightIndex === i)
          return (
            <g key={b.label} onMouseEnter={() => setHover(i)}>
              <rect x={x} y={0} width={bw} height={H - padB} fill="transparent" />
              <rect
                x={x}
                y={H - padB - h}
                width={bw}
                height={h}
                rx={3}
                fill={isHot ? ACCENT_BRIGHT : ACCENT}
                opacity={isHot ? 1 : 0.55}
              />
            </g>
          )
        })}
        <line x1={0} x2={W} y1={H - padB} y2={H - padB} stroke={GRID} strokeWidth="1" />
        <text x={0} y={H - 6} className="fill-[var(--text-faint)] text-[9px]">
          {bins[0].label}
        </text>
        <text
          x={W}
          y={H - 6}
          textAnchor="end"
          className="fill-[var(--text-faint)] text-[9px]"
        >
          {bins[bins.length - 1].label}
        </text>
      </svg>
      <figcaption className="mt-3 text-xs leading-5 text-[var(--text-faint)]">
        {active ? (
          <span className="text-[var(--text-dim)] tabular-nums">
            {active.label}{xLabel ? ` ${xLabel}` : ''} — {active.count.toLocaleString('en-GB')}
          </span>
        ) : (
          caption
        )}
      </figcaption>
    </figure>
  )
}

// ------------------------------------------------------------ case figure ---

/** Picks the right figure for a case study. Lives here, on the client side of
 *  the boundary, because number formatters are functions and functions cannot
 *  be handed from a server component to a client one. */
export function CaseFigure({
  chart,
}: {
  chart:
    | { kind: 'compare'; points: ComparePoint[]; caption: string; unit?: string }
    | {
        kind: 'sensitivity'
        points: SeriesPoint[]
        xLabel: string
        yLabel: string
        caption: string
        markerAt?: number
      }
    | { kind: 'histogram'; bins: { label: string; count: number }[]; caption: string; xLabel?: string }
}) {
  if (chart.kind === 'compare') {
    return <CompareBars points={chart.points} caption={chart.caption} unit={chart.unit} />
  }
  if (chart.kind === 'sensitivity') {
    return (
      <SensitivityLine
        points={chart.points}
        xLabel={chart.xLabel}
        yLabel={chart.yLabel}
        caption={chart.caption}
        markerAt={chart.markerAt}
        formatX={(v) => v.toFixed(1)}
        formatY={(v) => Math.round(v).toString()}
      />
    )
  }
  return (
    <Histogram
      bins={chart.bins}
      caption={chart.caption}
      xLabel={chart.xLabel}
    />
  )
}
