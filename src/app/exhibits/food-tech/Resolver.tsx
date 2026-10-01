'use client'

import { useEffect, useMemo, useState } from 'react'

// The demo: one search box, and an answer that shows its own working.
//
// The order of the output is deliberate. The resolved cluster comes first, then
// the hierarchy, then the funding, and the confidence column is never hidden.
// A tool that shows only the rows it got right is asking to be trusted; this
// one is asking to be checked.

interface Member {
  n: string
  c: string
  p: string
  /** Whether the register has been asked about this entity's parent yet.
   *  Saying "no parent reported" about an entity nobody has queried would be
   *  a different claim from the one the data supports. */
  q: boolean
  k: number
}

interface Group {
  group: string
  legal_entities: number
  countries: number
  country_list: string
  distinct_ultimate_parents: number
  ultimate_parent_names: string
  low_confidence_entities: number
  eu_projects: number
  eu_contribution_eur: number
  members: Member[]
  member_total: number
}

interface Blob {
  generated: string
  parents_checked: number
  parents_total: number
  rescued_by_hierarchy: number
  evaluation: {
    entities_total: number
    entities_scoreable: number
    true_pairs: number
    predicted_pairs: number
    true_positive: number
    false_positive: number
    false_negative: number
    precision: number
    recall: number
    f1: number
    false_positives_sharing_parent_root: number
    precision_if_those_counted_correct: number
  }
  false_positive_examples: {
    a: string
    a_parent: string
    b: string
    b_parent: string
    grouped_as: string
  }[]
  false_negative_examples: {
    a: string
    b: string
    shared_parent: string
  }[]
  groups: Group[]
}

const eur = (v: number) =>
  v >= 1_000_000
    ? `€${(v / 1_000_000).toFixed(1)}m`
    : v > 0
      ? `€${Math.round(v).toLocaleString('en-GB')}`
      : '—'

export function Resolver() {
  const [data, setData] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetch('/exhibits/food-tech/resolver.json')
      .then((r) => r.json())
      .then((d: Blob) => {
        setData(d)
        setSelected(d.groups[0]?.group ?? null)
      })
      .catch(() => setError('Could not load the dataset.'))
  }, [])

  const matches = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    if (!needle) return data.groups.slice(0, 10)
    return data.groups
      .filter(
        (g) =>
          g.group.toLowerCase().includes(needle) ||
          g.ultimate_parent_names.toLowerCase().includes(needle) ||
          g.members.some((m) => (m.n || '').toLowerCase().includes(needle)),
      )
      .slice(0, 10)
  }, [data, q])

  const active = useMemo(
    () => data?.groups.find((g) => g.group === selected) ?? null,
    [data, selected],
  )

  if (error) {
    return (
      <p className="rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-6 text-[var(--text-dim)]">
        {error}
      </p>
    )
  }
  if (!data) {
    return <p className="text-[var(--text-dim)]">Loading the dataset…</p>
  }

  const ev = data.evaluation

  return (
    <div>
      {/* ------------------------------------------------------- search --- */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-card)] p-6 sm:p-8">
        <label htmlFor="resolver-q" className="block text-sm text-[var(--text-dim)]">
          Type a company name
        </label>
        <input
          id="resolver-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nestle, Danone, Tetra Pak…"
          className="mt-2 w-full rounded-xl border border-[var(--line-bright)] bg-[var(--bg)] px-4 py-3 text-lg text-white placeholder:text-[var(--text-faint)] focus:border-[var(--blue)] focus:ring-1 focus:ring-[var(--blue)] focus:outline-none"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {matches.map((g) => (
            <button
              key={g.group}
              onClick={() => setSelected(g.group)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                selected === g.group
                  ? 'border-[var(--blue)] bg-[var(--blue)] text-white'
                  : 'border-[var(--line-bright)] text-[var(--text-dim)] hover:border-[var(--blue)] hover:text-white'
              }`}
            >
              {g.group}
              <span className="ml-2 opacity-60 tabular-nums">{g.member_total}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <p className="text-sm text-[var(--text-dim)]">
              Nothing in the slice matches that. The dataset covers {data.groups.length} food
              and food-technology groups.
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------- result --- */}
      {active && (
        <div className="mt-10">
          <h2 className="font-display text-3xl font-medium tracking-tight text-white">
            {active.group}
          </h2>

          <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Tile value={active.member_total.toLocaleString('en-GB')} label="legal entities found" />
            <Tile value={String(active.countries)} label="countries" />
            <Tile
              value={String(active.distinct_ultimate_parents)}
              label="ultimate parents reported"
            />
            <Tile
              value={eur(active.eu_contribution_eur)}
              label={`EU funding, ${active.eu_projects} projects`}
              accent={active.eu_contribution_eur > 0}
            />
          </dl>

          {active.ultimate_parent_names && (
            <p className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-5 py-4 text-sm text-[var(--text-dim)]">
              <span className="text-white">Rolls up to:</span>{' '}
              {active.ultimate_parent_names.split('|').join(' · ')}
              <span className="mt-2 block text-[var(--text-faint)]">
                Self-reported by the entity to the LEI register. Not inferred.
              </span>
            </p>
          )}

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line-bright)] text-left">
                  <Th>Legal entity</Th>
                  <Th>Country</Th>
                  <Th>Reported ultimate parent</Th>
                  <Th className="text-right">Confidence</Th>
                </tr>
              </thead>
              <tbody>
                {active.members.map((m, i) => (
                  <tr key={`${m.n}-${i}`} className="border-b border-[var(--line)]">
                    <Td className="py-3 text-white">{m.n}</Td>
                    <Td className="py-3 text-[var(--text-dim)]">{m.c || '—'}</Td>
                    <Td className="py-3 text-[var(--text-dim)]">
                      {m.p ? (
                        m.p
                      ) : m.q ? (
                        <span className="text-[var(--text-faint)]">none on file</span>
                      ) : (
                        <span className="text-[var(--text-faint)]">not yet queried</span>
                      )}
                    </Td>
                    <Td className="py-3 text-right tabular-nums">
                      <span
                        className={
                          m.k >= 0.9
                            ? 'text-[var(--blue-light)]'
                            : m.k >= 0.7
                              ? 'text-[var(--text-dim)]'
                              : 'text-[#f59e0b]'
                        }
                      >
                        {m.k.toFixed(1)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.parents_checked < data.parents_total && (
            <p className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-5 py-4 text-sm text-[var(--text-dim)]">
              Parent lookups are{' '}
              <span className="text-white tabular-nums">
                {Math.round((data.parents_checked / data.parents_total) * 100)}% complete
              </span>{' '}
              ({data.parents_checked.toLocaleString('en-GB')} of{' '}
              {data.parents_total.toLocaleString('en-GB')} entities). The register rate-limits, so
              the rest are still being collected. Rows marked{' '}
              <span className="text-[var(--text-faint)]">not yet queried</span> are exactly that —
              not a statement that no parent exists.
            </p>
          )}

          {active.member_total > active.members.length && (
            <p className="mt-4 text-sm text-[var(--text-faint)]">
              Showing {active.members.length} of {active.member_total}. The rest are in the
              download.
            </p>
          )}
        </div>
      )}

      {/* --------------------------------------------------- the method --- */}
      <div className="mt-20 border-t border-[var(--line)] pt-10">
        <h2 className="font-display text-2xl font-medium text-white">
          How well it works, including where it fails
        </h2>
        <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
          Grouping companies by name is a guess. Grading it needs an answer key, and the register
          supplies one: {ev.entities_scoreable.toLocaleString('en-GB')} of the{' '}
          {ev.entities_total.toLocaleString('en-GB')} entities have told the LEI register who their
          ultimate parent is. Two entities naming the same parent are the same group — a fact
          nobody had to label, and one the matching never sees.
        </p>

        <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
          The score below is for the name layer <span className="text-white">only</span>. The
          dataset also places{' '}
          <span className="tabular-nums">{data.rescued_by_hierarchy.toLocaleString('en-GB')}</span>{' '}
          further entities using the parent they have filed — MARS PETCARE and MARS AVENUE are
          indistinguishable to any string matcher, but one of them has told the register who owns
          it. Those are deliberately excluded from the score: using the answer inside the
          prediction would make the number meaningless, however good it looked.
        </p>

        <dl className="mt-10 grid gap-6 sm:grid-cols-3">
          <Measure
            value={`${(ev.precision * 100).toFixed(1)}%`}
            label="precision"
            note={`of the pairs it grouped together, this share really do share a parent. ${ev.false_positive.toLocaleString('en-GB')} pairs were wrong.`}
          />
          <Measure
            value={`${(ev.recall * 100).toFixed(1)}%`}
            label="recall"
            note={`of the pairs that truly belong together, this share were found. ${ev.false_negative.toLocaleString('en-GB')} were missed.`}
          />
          <Measure
            value={ev.true_pairs.toLocaleString('en-GB')}
            label="pairs in the answer key"
            note="every pair of entities reporting the same ultimate parent"
          />
        </dl>

        <p className="mt-10 max-w-3xl rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-5 py-4 text-sm leading-6 text-[var(--text-dim)]">
          <span className="text-white">The answer key has a limit of its own, and it flatters
          nobody here.</span>{' '}
          {ev.false_positives_sharing_parent_root.toLocaleString('en-GB')} of the{' '}
          {ev.false_positive.toLocaleString('en-GB')} wrong pairs are cases where one group files
          under two parent entities whose names share a root — UNILEVER PLC and UNILEVER N.V. were
          the two halves of a single dual-listed company, and the key counts them as different
          groups. Allowing those would put precision at{' '}
          <span className="tabular-nums">
            {(ev.precision_if_those_counted_correct * 100).toFixed(1)}%
          </span>
          . The figure published above stays at{' '}
          <span className="tabular-nums">{(ev.precision * 100).toFixed(1)}%</span>, because
          adjusting a score against the thing being scored is how a number stops meaning anything.
        </p>

        {data.false_positive_examples.length > 0 && (
          <>
            <h3 className="mt-14 font-display text-lg font-semibold text-white">
              Wrongly put together
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-dim)]">
              The name said one company; the register says two. These are the rows a buyer should
              look at before trusting the rest.
            </p>
            <ul className="mt-6 space-y-3">
              {data.false_positive_examples.map((f, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-[#f59e0b]/25 bg-[#f59e0b]/5 px-5 py-4 text-sm"
                >
                  <p className="text-white">{f.a}</p>
                  <p className="text-[var(--text-faint)]">parent: {f.a_parent}</p>
                  <p className="mt-2 text-white">{f.b}</p>
                  <p className="text-[var(--text-faint)]">parent: {f.b_parent}</p>
                  <p className="mt-2 text-[var(--text-dim)]">
                    Both were grouped as {f.grouped_as}.
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}

        {data.false_negative_examples.length > 0 && (
          <>
            <h3 className="mt-14 font-display text-lg font-semibold text-white">Missed</h3>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-dim)]">
              Same parent on file, but the names share nothing a rule could catch.
            </p>
            <ul className="mt-6 space-y-3">
              {data.false_negative_examples.map((f, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-5 py-4 text-sm"
                >
                  <p className="text-white">
                    {f.a} <span className="text-[var(--text-faint)]">and</span> {f.b}
                  </p>
                  <p className="mt-1 text-[var(--text-faint)]">
                    both report {f.shared_parent}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
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

function Measure({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="border-t border-white/80 pt-4">
      <dd className="font-display text-4xl font-medium text-white tabular-nums">{value}</dd>
      <dt className="mt-2 text-white">{label}</dt>
      <p className="mt-2 text-sm leading-6 text-[var(--text-faint)]">{note}</p>
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
