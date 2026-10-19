'use client'

import { useState } from 'react'

// Journalists and researchers copy citations; a block they have to retype is
// one they get wrong. Two formats only: APA for prose, BibTeX for papers.
export function CiteThis({ apa, bibtex }: { apa: string; bibtex: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 1600)
    } catch {
      setCopied(null)
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {(
        [
          ['APA', apa],
          ['BibTeX', bibtex],
        ] as const
      ).map(([label, text]) => (
        <div key={label} className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-sm font-semibold tracking-wider text-white">{label}</h3>
            <button
              type="button"
              onClick={() => copy(label, text)}
              className="rounded-full border border-[var(--line-bright)] px-3 py-1 text-xs font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
            >
              {copied === label ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="mt-4 overflow-x-auto text-xs leading-5 whitespace-pre-wrap break-words text-[var(--text-dim)]">
            {text}
          </pre>
        </div>
      ))}
    </div>
  )
}
