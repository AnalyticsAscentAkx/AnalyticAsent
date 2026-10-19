'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { VerdictPill } from '@/components/really-european/VerdictPill'
import type { Row, Verdict } from '@/lib/really-european'

// The checker. It reads the published JSON from this site and searches it in
// the tab; what the visitor types never leaves the browser. The one optional
// step that does is the GLEIF lookup, which sends the typed name (and then one
// LEI) to api.gleif.org — never to us — one request at a time with a pause
// between them, as GLEIF asks of bulk users.
//
// A GLEIF answer is never turned into a verdict. A reported parent is the
// company's own filing; it is shown as what it is, and the card stays
// "unverified" until a primary document is in the dataset.

const GLEIF = 'https://api.gleif.org/api/v1/lei-records'
const PAUSE_MS = 900
const LEI_RE = /^[A-Z0-9]{18}[0-9]{2}/

interface Blob {
  meta: { checked_on: string; evidence_rule: string }
  rows: Row[]
}

interface GleifHit {
  lei: string
  name: string
  country: string
  status: string
  renewal: string
}

interface GleifDetail extends GleifHit {
  parent?: { lei: string; name: string; country: string }
  exception?: string
  checkedAt: string
}

let lastCall = 0
async function gleifGet(url: string): Promise<Response> {
  const wait = lastCall + PAUSE_MS - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCall = Date.now()
  return fetch(url, { headers: { Accept: 'application/vnd.api+json' } })
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toHit(d: any): GleifHit {
  const a = d.attributes
  return {
    lei: a.lei,
    name: a.entity?.legalName?.name ?? '',
    country: a.entity?.legalAddress?.country ?? '',
    status: a.registration?.status ?? '',
    renewal: (a.registration?.nextRenewalDate ?? '').slice(0, 10),
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function norm(s: string) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function score(r: Row, q: string): number {
  if (!q) return 0
  const p = norm(r.product)
  const e = norm(r.legal_entity)
  if (r.slug === q.replace(/ /g, '-') || p === q) return 100
  if (p.startsWith(q)) return 80
  if (e.startsWith(q)) return 70
  if (p.includes(q)) return 60
  if (e.includes(q)) return 50
  if (norm(r.lei).startsWith(q)) return 45
  if (norm(r.owner).includes(q)) return 20
  return 0
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rule-fade pt-3">
      <dt className="text-xs font-semibold tracking-wider text-[var(--text-faint)] uppercase">{label}</dt>
      <dd className="mt-1 text-sm leading-6 break-words text-[var(--text)]">{children}</dd>
    </div>
  )
}

export function Checker({
  featured,
  verdictLines,
}: {
  featured: string[]
  verdictLines: Record<Verdict, string>
}) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [gleifState, setGleifState] = useState<'idle' | 'searching' | 'done' | 'error'>('idle')
  const [hits, setHits] = useState<GleifHit[]>([])
  const [detail, setDetail] = useState<GleifDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const featuredSet = useMemo(() => new Set(featured), [featured])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/data/really-european.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((b: Blob) => {
        setBlob(b)
        const fromUrl = new URLSearchParams(window.location.search).get('q')
        if (fromUrl) {
          const hit = b.rows.find((r) => r.slug === fromUrl)
          setQ(hit ? hit.product : fromUrl)
          if (hit) setPicked(hit.slug)
        }
      })
      .catch(() => setLoadError(true))
  }, [])

  const results = useMemo(() => {
    if (!blob) return []
    const nq = norm(q)
    if (!nq) return []
    return blob.rows
      .map((r) => [r, score(r, nq)] as const)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1] || a[0].product.localeCompare(b[0].product))
      .slice(0, 8)
      .map(([r]) => r)
  }, [blob, q])

  const current = blob?.rows.find((r) => r.slug === (picked ?? results[0]?.slug)) ?? null

  async function searchGleif() {
    const term = q.trim()
    if (!term) return
    setGleifState('searching')
    setHits([])
    setDetail(null)
    try {
      const res = await gleifGet(`${GLEIF}?filter[fulltext]=${encodeURIComponent(term)}&page[size]=5`)
      if (!res.ok) throw new Error(String(res.status))
      const json = await res.json()
      setHits((json.data ?? []).map(toHit))
      setGleifState('done')
    } catch {
      setGleifState('error')
    }
  }

  async function openHit(h: GleifHit) {
    setDetailLoading(true)
    setDetail(null)
    const d: GleifDetail = { ...h, checkedAt: new Date().toISOString().slice(0, 10) }
    try {
      const p = await gleifGet(`${GLEIF}/${h.lei}/ultimate-parent`)
      if (p.ok) {
        const pj = await p.json()
        if (pj.data?.type === 'lei-records') {
          const ph = toHit(pj.data)
          d.parent = { lei: ph.lei, name: ph.name, country: ph.country }
        }
      }
      if (!d.parent) {
        const x = await gleifGet(`${GLEIF}/${h.lei}/ultimate-parent-reporting-exception`)
        if (x.ok) {
          const xj = await x.json()
          d.exception = xj.data?.attributes?.reason
        }
      }
    } catch {
      // Show what we have; the card says the parent could not be read.
    }
    setDetail(d)
    setDetailLoading(false)
  }

  return (
    <div>
      <label htmlFor="re-q" className="block text-sm font-semibold text-white">
        Product or company
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          id="re-q"
          type="search"
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPicked(null)
            setGleifState('idle')
            setHits([])
            setDetail(null)
          }}
          placeholder="e.g. Spotify, Hetzner, Proton, bol.com"
          className="w-full rounded-xl border border-[var(--line-bright)] bg-[var(--bg-card)] px-4 py-3 text-base text-white placeholder:text-[var(--text-faint)] focus:border-[var(--blue)] focus:outline-none"
        />
      </div>
      <p className="mt-2 text-xs text-[var(--text-faint)]">
        Searched in your browser. Nothing you type is sent to us.
        {blob ? ` ${blob.rows.length} rows, checked ${blob.meta.checked_on}.` : ''}
      </p>
      {loadError && (
        <p className="mt-4 text-sm text-white">
          The dataset did not load. Try again, or download it from{' '}
          <a href="/data/really-european.csv" className="text-[var(--blue-light)] underline">
            /data/really-european.csv
          </a>
          .
        </p>
      )}

      {results.length > 1 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Matches">
          {results.map((r) => (
            <li key={r.slug}>
              <button
                type="button"
                onClick={() => setPicked(r.slug)}
                className={
                  r.slug === current?.slug
                    ? 'rounded-full border border-[var(--blue)] bg-[var(--blue-deep)] px-3 py-1 text-sm text-white'
                    : 'rounded-full border border-[var(--line-bright)] px-3 py-1 text-sm text-[var(--text-dim)] hover:text-white'
                }
              >
                {r.product}
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <article className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-6 sm:p-10" aria-live="polite">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-[var(--text-dim)]">{current.category}</p>
              <h2 className="mt-1 font-display text-3xl font-medium tracking-tight text-white">{current.product}</h2>
            </div>
            <VerdictPill verdict={current.verdict} className="text-sm" />
          </div>
          <p className="mt-4 max-w-3xl text-[var(--text-dim)]">{verdictLines[current.verdict]}</p>

          <dl className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            <Field label="Legal entity">
              {current.legal_entity || 'Not resolved'}
              {current.country ? ` (${current.country})` : ''}
            </Field>
            <Field label="Register id">{current.registry_id || 'None found'}</Field>
            <Field label="LEI">
              {LEI_RE.test(current.lei) ? (
                <a
                  href={`https://search.gleif.org/#/record/${current.lei.slice(0, 20)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[var(--blue-light)] underline-offset-4 hover:underline"
                >
                  {current.lei}
                </a>
              ) : (
                current.lei || 'None'
              )}
              {current.lei_status ? ` · ${current.lei_status}` : ''}
              {current.lei_renewal ? ` · renews ${current.lei_renewal}` : ''}
            </Field>
            <Field label="Parent as GLEIF reports it">{current.gleif_parent || 'Nothing reported'}</Field>
            <Field label="Controlling owner, from documents">
              {current.verdict === 'unverified' ? (
                <span className="text-[var(--text-dim)]">Not verified. See our notes below.</span>
              ) : (
                <>
                  {current.owner}
                  {current.owner_country ? ` (${current.owner_country})` : ''}
                </>
              )}
            </Field>
            <Field label="Control type">{current.control_type}</Field>
            <Field label="Source">
              {current.source_url ? (
                <a
                  href={current.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--blue-light)] underline-offset-4 hover:underline"
                >
                  {host(current.source_url)}
                </a>
              ) : (
                'No free primary document found'
              )}
            </Field>
            <Field label="Checked">
              {current.checked_on} · confidence {current.confidence || 'n/a'}
            </Field>
          </dl>

          {current.notes && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-white">Our notes on this row</summary>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-dim)]">{current.notes}</p>
            </details>
          )}

          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            {featuredSet.has(current.slug) && (
              <Link href={`/really-european/${current.slug}`} className="text-[var(--blue-light)] underline-offset-4 hover:underline">
                Full answer page
              </Link>
            )}
            <Link
              href={`/really-european/badge?slug=${current.slug}`}
              className="text-[var(--blue-light)] underline-offset-4 hover:underline"
            >
              Badge for this row
            </Link>
            <Link href="/really-european" className="text-[var(--blue-light)] underline-offset-4 hover:underline">
              All rows
            </Link>
          </div>
        </article>
      )}

      {blob && norm(q).length >= 2 && (
        <div className="mt-10 rounded-2xl border border-dashed border-[var(--line-bright)] p-6">
          <h2 className="font-display text-lg font-semibold text-white">
            {results.length ? 'Not the one you meant?' : 'Not in our dataset yet'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--text-dim)]">
            Look the name up live in the global LEI register. This sends what you typed to api.gleif.org
            (not to us). GLEIF shows what a company reported about itself, so the result stays unverified.
          </p>
          <button
            type="button"
            onClick={searchGleif}
            disabled={gleifState === 'searching'}
            className="mt-4 rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)] disabled:opacity-60"
          >
            {gleifState === 'searching' ? 'Asking GLEIF…' : `Look up “${q.trim()}” at GLEIF`}
          </button>
          {gleifState === 'error' && (
            <p className="mt-3 text-sm text-white">GLEIF did not answer. Try again in a moment.</p>
          )}
          {gleifState === 'done' && hits.length === 0 && (
            <p className="mt-3 text-sm text-white">
              GLEIF has no LEI matching that name. Many European companies hold none.
            </p>
          )}
          {hits.length > 0 && (
            <ul className="mt-4 space-y-2">
              {hits.map((h) => (
                <li key={h.lei}>
                  <button
                    type="button"
                    onClick={() => openHit(h)}
                    className="w-full rounded-xl border border-[var(--line)] px-4 py-3 text-left text-sm hover:border-[var(--blue)]"
                  >
                    <span className="font-semibold text-white">{h.name}</span>{' '}
                    <span className="text-[var(--text-dim)]">
                      {h.country} · <span className="font-mono">{h.lei}</span> · {h.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {detailLoading && <p className="mt-4 text-sm text-[var(--text-dim)]">Reading the parent record…</p>}
          {detail && (
            <article className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h3 className="font-display text-xl font-semibold text-white">{detail.name}</h3>
                <VerdictPill verdict="unverified" />
              </div>
              <dl className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                <Field label="LEI">
                  <span className="font-mono">{detail.lei}</span> · {detail.status}
                  {detail.renewal ? ` · renews ${detail.renewal}` : ''}
                </Field>
                <Field label="Country">{detail.country}</Field>
                <Field label="Ultimate parent as reported to GLEIF">
                  {detail.parent
                    ? `${detail.parent.name} (${detail.parent.country}, ${detail.parent.lei})`
                    : detail.exception
                      ? `None reported: exception ${detail.exception}`
                      : 'Could not be read'}
                </Field>
                <Field label="Source">
                  <a
                    href={`https://search.gleif.org/#/record/${detail.lei}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--blue-light)] underline-offset-4 hover:underline"
                  >
                    GLEIF record
                  </a>{' '}
                  · read {detail.checkedAt}
                </Field>
              </dl>
              <p className="mt-6 text-sm text-[var(--text-dim)]">
                Unverified: a GLEIF parent is self-reported and many companies report none. It is a lead for
                the register, not a finding about control.
              </p>
            </article>
          )}
        </div>
      )}
    </div>
  )
}
