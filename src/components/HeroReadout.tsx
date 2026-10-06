'use client'

import { useEffect, useRef, useState } from 'react'

import bench from '@/lib/cm/benchmark.json'

// The object in the hero.
//
// A headline over an animation gives the eye nothing to land on. This is the
// engine's own readout — the measured benchmark from benchmark.json, not a
// mock-up — drawn as an instrument panel sitting over the field the solver is
// working. Every figure here is the same one the Quote Matcher page reports.
//
// It counts up once on first paint and then holds. That is the single
// orchestrated moment on the page; nothing else moves on load.

const RECALL = bench.recallAt10
const BAND = bench.priceMedape
const COVERAGE = bench.priceRangeCoverage
const GAIN = bench.messy.enrichment_gain_points
const HELD_OUT = bench.nQueries
const CATALOGUE = bench.nCatalogue

function useCountUp(target: number, ms = 1400) {
  const [v, setV] = useState(0)
  const start = useRef<number | null>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(target)
      return
    }
    let raf = 0
    const tick = (t: number) => {
      if (start.current === null) start.current = t
      const p = Math.min(1, (t - start.current) / ms)
      // Ease-out so it arrives rather than stops.
      const e = 1 - Math.pow(1 - p, 3)
      setV(target * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function HeroReadout({ className = '' }: { className?: string }) {
  const recall = useCountUp(RECALL)
  const band = useCountUp(BAND, 1600)
  const coverage = useCountUp(COVERAGE, 1800)
  const gain = useCountUp(GAIN, 1800)

  // Gauge geometry: a 240° arc, open at the bottom.
  const R = 54
  const C = 2 * Math.PI * R
  const SWEEP = 240 / 360
  const arcLen = C * SWEEP
  const filled = arcLen * recall

  return (
    <div
      className={`relative rounded-3xl border border-[var(--line-bright)] bg-[rgb(12_20_36/0.72)] p-6 backdrop-blur-md sm:p-7 ${className}`}
      aria-label={`Benchmark: ${Math.round(RECALL * 1000) / 10}% recall at ten on ${HELD_OUT.toLocaleString('en-GB')} held-out parts; median price error ±${Math.round(BAND * 1000) / 10}%`}
    >
      {/* top edge highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--blue-light)]/60 to-transparent"
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Quote Matcher</p>
          <p className="mt-0.5 text-xs text-[var(--text-faint)]">
            measured on {HELD_OUT.toLocaleString('en-GB')} parts held out of{' '}
            {CATALOGUE.toLocaleString('en-GB')}
          </p>
        </div>
        <span className="mt-1 inline-flex items-center gap-2 text-xs text-[var(--text-dim)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--blue-light)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--blue-light)]" />
          </span>
          live
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-6">
        {/* gauge */}
        <svg viewBox="0 0 140 140" className="h-32 w-32 sm:h-36 sm:w-36" aria-hidden="true">
          <g transform="rotate(150 70 70)">
            <circle
              cx="70" cy="70" r={R} fill="none"
              stroke="var(--line-bright)" strokeWidth="6"
              strokeDasharray={`${arcLen} ${C}`} strokeLinecap="round"
            />
            <circle
              cx="70" cy="70" r={R} fill="none"
              stroke="var(--blue-light)" strokeWidth="6"
              strokeDasharray={`${filled} ${C}`} strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px rgb(96 165 250 / 0.6))' }}
            />
          </g>
          <text
            x="70" y="66" textAnchor="middle"
            className="fill-white font-display"
            style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            {(recall * 100).toFixed(1)}%
          </text>
          <text x="70" y="86" textAnchor="middle" fill="var(--text-faint)" style={{ fontSize: 9.5 }}>
            recall at ten
          </text>
        </svg>

        {/* the band */}
        <div>
          <p className="text-xs text-[var(--text-faint)]">price anchor, median error</p>
          <p className="stat mt-1 font-display text-4xl font-medium">
            ±{(band * 100).toFixed(1)}%
          </p>
          <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]">
            <span
              className="absolute inset-y-0 rounded-full bg-[var(--blue)]"
              style={{
                left: `${50 - band * 50}%`,
                width: `${band * 100}%`,
                boxShadow: '0 0 10px rgb(59 130 246 / 0.5)',
              }}
            />
            <span className="absolute inset-y-0 left-1/2 w-px bg-white/70" />
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-faint)]">
            against ±{(bench.naiveMedape * 100).toFixed(0)}% from a regression baseline
          </p>
        </div>
      </div>

      <dl className="rule-fade mt-6 grid grid-cols-2 gap-x-6 pt-5">
        <div>
          <dd className="stat font-display text-2xl font-medium">{Math.round(coverage * 100)}%</dd>
          <dt className="mt-1 text-xs leading-4 text-[var(--text-faint)]">
            of true prices inside the stated range
          </dt>
        </div>
        <div>
          <dd className="stat font-display text-2xl font-medium">+{gain.toFixed(1)}</dd>
          <dt className="mt-1 text-xs leading-4 text-[var(--text-faint)]">
            points of recall from reading messy input properly
          </dt>
        </div>
      </dl>
    </div>
  )
}
