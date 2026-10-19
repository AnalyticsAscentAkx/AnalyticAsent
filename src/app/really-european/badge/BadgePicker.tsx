'use client'

import { useEffect, useMemo, useState } from 'react'

// Pick a row, see the badge, copy the snippet. The badge is a static SVG on
// this site, dated, and it links back to the row's evidence, so an embed can
// never claim more than the data does or outlive a correction silently.

export interface BadgeOption {
  slug: string
  product: string
  verdict: string
  checked_on: string
  page: boolean
}

export function BadgePicker({ options, origin }: { options: BadgeOption[]; origin: string }) {
  const [slug, setSlug] = useState(options[0]?.slug ?? '')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('slug')
    if (s && options.some((o) => o.slug === s)) setSlug(s)
  }, [options])

  const o = useMemo(() => options.find((x) => x.slug === slug), [options, slug])
  if (!o) return null
  const img = `${origin}/really-european/badge/${o.slug}.svg`
  const href = o.page ? `${origin}/really-european/${o.slug}` : `${origin}/really-european/check?q=${o.slug}`
  const alt = `${o.product} ownership: ${o.verdict}, checked ${o.checked_on}`
  const snippets: [string, string][] = [
    ['HTML', `<a href="${href}"><img src="${img}" alt="${alt}" height="20"></a>`],
    ['Markdown', `[![${alt}](${img})](${href})`],
  ]

  const copy = async (k: string, t: string) => {
    try {
      await navigator.clipboard.writeText(t)
      setCopied(k)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }

  return (
    <div>
      <label htmlFor="badge-slug" className="block text-sm font-semibold text-white">
        Product or provider
      </label>
      <select
        id="badge-slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        className="mt-2 w-full max-w-md rounded-xl border border-[var(--line-bright)] bg-[var(--bg-card)] px-4 py-3 text-white focus:border-[var(--blue)] focus:outline-none"
      >
        {options.map((x) => (
          <option key={x.slug} value={x.slug}>
            {x.product}
          </option>
        ))}
      </select>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/really-european/badge/${o.slug}.svg`} alt={alt} className="h-5" />
      </div>

      <div className="mt-6 space-y-4">
        {snippets.map(([k, t]) => (
          <div key={k} className="min-w-0 rounded-2xl border border-[var(--line)] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold tracking-wider text-[var(--text-faint)] uppercase">{k}</span>
              <button
                type="button"
                onClick={() => copy(k, t)}
                className="rounded-full border border-[var(--line-bright)] px-3 py-1 text-xs font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
              >
                {copied === k ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="mt-3 text-xs leading-5 whitespace-pre-wrap break-all text-[var(--text-dim)]">{t}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
