'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { VerdictPill } from '@/components/really-european/VerdictPill'
import type { GleifView, Region, Verdict } from '@/lib/really-european'

// The table is the audit. Filters narrow it, headers sort it, and every row
// carries the document it rests on: a verdict without its source link is the
// thing the directories already publish.

export interface TableRow {
  slug: string
  product: string
  legal_entity: string
  country: string
  category: string
  verdict: Verdict
  owner: string
  owner_country: string
  region: Region
  gleif: GleifView
  gleifLabel: string
  source_url: string
  checked_on: string
  list: 'directory' | 'dora-provider' | 'both'
  listed_on: number
  /** Whether /really-european/<slug> exists; otherwise the row links the checker. */
  page: boolean
}

type SortKey = 'product' | 'country' | 'verdict' | 'owner_country' | 'listed_on'

const VERDICT_ORDER: Record<Verdict, number> = {
  'non-eu-controlled': 0,
  'pe-controlled': 1,
  'eu-controlled': 2,
  unverified: 3,
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const SELECT =
  'mt-1 w-full rounded-lg border border-[var(--line-bright)] bg-[var(--bg-card)] px-3 py-2 text-sm text-white focus:border-[var(--blue)] focus:outline-none'

export function AuditTable({
  rows,
  verdictLabels,
}: {
  rows: TableRow[]
  verdictLabels: Record<Verdict, string>
}) {
  const [list, setList] = useState<'directory' | 'dora-provider' | 'all'>('directory')
  const [country, setCountry] = useState('')
  const [category, setCategory] = useState('')
  const [verdict, setVerdict] = useState<'' | Verdict>('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'verdict', dir: 1 })

  const inList = useMemo(
    () =>
      rows.filter((r) =>
        list === 'all' ? true : list === 'directory' ? r.list !== 'dora-provider' : r.list !== 'directory',
      ),
    [rows, list],
  )
  const countries = useMemo(() => [...new Set(inList.map((r) => r.country).filter(Boolean))].sort(), [inList])
  const categories = useMemo(() => [...new Set(inList.map((r) => r.category))].sort(), [inList])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const out = inList.filter(
      (r) =>
        (!country || r.country === country) &&
        (!category || r.category === category) &&
        (!verdict || r.verdict === verdict) &&
        (!needle ||
          r.product.toLowerCase().includes(needle) ||
          r.legal_entity.toLowerCase().includes(needle) ||
          r.owner.toLowerCase().includes(needle)),
    )
    const { key, dir } = sort
    return out.sort((a, b) => {
      let c = 0
      if (key === 'verdict') c = VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict]
      else if (key === 'listed_on') c = b.listed_on - a.listed_on
      else c = String(a[key] || '￿').localeCompare(String(b[key] || '￿'))
      return c * dir || a.product.localeCompare(b.product)
    })
  }, [inList, country, category, verdict, q, sort])

  const head = (key: SortKey, label: string) => (
    <th scope="col" className="px-3 py-3 text-left font-semibold">
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }))}
        className="inline-flex items-center gap-1 text-white hover:text-[var(--blue-light)]"
        aria-label={`Sort by ${label}`}
      >
        {label}
        <span aria-hidden="true" className="text-[var(--text-faint)]">
          {sort.key === key ? (sort.dir === 1 ? '↓' : '↑') : '↕'}
        </span>
      </button>
    </th>
  )

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block text-xs font-semibold tracking-wider text-[var(--text-dim)] uppercase lg:col-span-1">
          Search
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Product, company or owner"
            className={SELECT}
          />
        </label>
        <label className="block text-xs font-semibold tracking-wider text-[var(--text-dim)] uppercase">
          List
          <select
            value={list}
            onChange={(e) => {
              setList(e.target.value as typeof list)
              setCountry('')
              setCategory('')
            }}
            className={SELECT}
          >
            <option value="directory">Buy-European directories</option>
            <option value="dora-provider">ICT providers (DORA)</option>
            <option value="all">Everything</option>
          </select>
        </label>
        <label className="block text-xs font-semibold tracking-wider text-[var(--text-dim)] uppercase">
          Country of entity
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={SELECT}>
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold tracking-wider text-[var(--text-dim)] uppercase">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={SELECT}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold tracking-wider text-[var(--text-dim)] uppercase">
          Verdict
          <select value={verdict} onChange={(e) => setVerdict(e.target.value as '' | Verdict)} className={SELECT}>
            <option value="">All verdicts</option>
            {(Object.keys(verdictLabels) as Verdict[]).map((v) => (
              <option key={v} value={v}>
                {verdictLabels[v]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 text-sm text-[var(--text-dim)]" aria-live="polite">
        Showing <span className="stat font-semibold">{shown.length}</span> of {inList.length} rows.
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-[var(--bg-raised)] text-xs tracking-wider uppercase">
            <tr>
              {head('product', 'Product')}
              {head('country', 'Entity')}
              {head('verdict', 'Verdict')}
              {head('owner_country', 'Verified owner')}
              <th scope="col" className="px-3 py-3 text-left font-semibold text-white">
                GLEIF parent
              </th>
              {head('listed_on', 'Source')}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.slug} className="border-t border-[var(--line)] align-top">
                <td className="px-3 py-3">
                  <Link
                    href={r.page ? `/really-european/${r.slug}` : `/really-european/check?q=${encodeURIComponent(r.slug)}`}
                    className="font-semibold text-white hover:text-[var(--blue-light)]"
                  >
                    {r.product}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--text-faint)]">{r.category}</div>
                </td>
                <td className="max-w-[16rem] px-3 py-3 text-[var(--text-dim)]">
                  <div className="line-clamp-2" title={r.legal_entity}>
                    {r.legal_entity || '—'}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-faint)]">{r.country || 'country unknown'}</div>
                </td>
                <td className="px-3 py-3">
                  <VerdictPill verdict={r.verdict} />
                </td>
                <td className="max-w-[20rem] px-3 py-3 text-[var(--text-dim)]">
                  {r.verdict === 'unverified' ? (
                    <span className="text-[var(--text-faint)]">Not verified</span>
                  ) : (
                    <>
                      <div className="line-clamp-2" title={r.owner}>
                        {r.owner}
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-faint)]">
                        {r.owner_country}
                        {' · '}
                        {r.region}
                      </div>
                    </>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-[var(--text-dim)]">{r.gleifLabel}</td>
                <td className="px-3 py-3 text-xs">
                  {r.source_url ? (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--blue-light)] underline-offset-4 hover:underline"
                    >
                      {host(r.source_url)}
                    </a>
                  ) : (
                    <span className="text-[var(--text-faint)]">none found</span>
                  )}
                  <div className="mt-1 text-[var(--text-faint)]">checked {r.checked_on}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
