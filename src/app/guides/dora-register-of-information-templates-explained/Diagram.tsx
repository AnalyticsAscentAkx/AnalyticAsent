import { TABLES } from '@/lib/dora/schema'

// The join graph of the Register of Information, drawn from the taxonomy.
//
// Every arrow is one of the 22 references the EBA's DPM declares and enforces
// as rule 807; the labels are the EBA's own R-numbers. The arrow runs from the
// table that *refers* to the table that *defines*, which is the direction a
// filer has to read it in: fill the head of the arrow first. Nothing here is
// typed by hand except the node positions — the edges come from schema.json,
// so if the taxonomy changes, the picture changes with it.

const W = 130
const H = 40

const POS: Record<string, [number, number]> = {
  'B_01.01': [30, 40],
  'B_01.02': [30, 200],
  'B_06.01': [30, 360],
  'B_99.01': [30, 540],
  'B_01.03': [250, 40],
  'B_03.01': [250, 150],
  'B_03.03': [250, 260],
  'B_04.01': [250, 370],
  'B_02.03': [470, 40],
  'B_02.01': [470, 200],
  'B_02.02': [470, 520],
  'B_03.02': [690, 260],
  'B_05.02': [690, 480],
  'B_05.01': [900, 120],
  'B_07.01': [900, 560],
}

const SHORT: Record<string, string> = {
  'B_01.01': 'Reporting entity',
  'B_01.02': 'Entities in scope',
  'B_01.03': 'Branches',
  'B_02.01': 'Contracts',
  'B_02.02': 'Contract × service',
  'B_02.03': 'Intra-group links',
  'B_03.01': 'Signing entities',
  'B_03.02': 'Signing providers',
  'B_03.03': 'Intra-group providers',
  'B_04.01': 'Entities using',
  'B_05.01': 'Providers',
  'B_05.02': 'Supply chains',
  'B_06.01': 'Functions',
  'B_07.01': 'Assessments',
  'B_99.01': 'Definitions',
}

interface Edge {
  from: string
  to: string
  labels: string[]
}

/** One line per (from, to) pair; two references between the same tables
 *  share a line and carry both labels. */
function edges(): Edge[] {
  const map = new Map<string, Edge>()
  for (const t of TABLES) {
    for (const r of t.references) {
      const key = `${t.code}>${r.table}`
      const label = r.name.split(/\s+/)[0].replace(/_.*$/, '')
      const e = map.get(key)
      if (e) e.labels.push(label)
      else map.set(key, { from: t.code, to: r.table, labels: [label] })
    }
  }
  return [...map.values()]
}

function centre(code: string): [number, number] {
  const [x, y] = POS[code]
  return [x + W / 2, y + H / 2]
}

/** Point where the segment from `from` to `to` leaves the box around `from`. */
function boundary(from: string, to: string): [number, number] {
  const [cx, cy] = centre(from)
  const [tx, ty] = centre(to)
  const dx = tx - cx
  const dy = ty - cy
  const t = Math.min(dx === 0 ? Infinity : W / 2 / Math.abs(dx), dy === 0 ? Infinity : H / 2 / Math.abs(dy))
  return [cx + dx * t, cy + dy * t]
}

export function JoinDiagram() {
  const all = edges()
  const lines = all.filter((e) => e.from !== e.to)
  const loops = all.filter((e) => e.from === e.to)

  return (
    <figure className="mt-8">
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
        <svg
          viewBox="0 0 1040 620"
          role="img"
          aria-labelledby="join-title join-desc"
          className="h-auto w-full min-w-[720px]"
        >
          <title id="join-title">How the fifteen Register of Information templates join</title>
          <desc id="join-desc">
            Fifteen boxes, one per template, with twenty-two arrows. Each arrow runs from a table that refers to
            a key to the table that defines it, labelled with the EBA reference number. The same links are listed
            as text below the figure.
          </desc>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--blue-light)" />
            </marker>
          </defs>

          {lines.map((e) => {
            const [x1, y1] = boundary(e.from, e.to)
            const [x2, y2] = boundary(e.to, e.from)
            const mx = (x1 + x2) / 2
            const my = (y1 + y2) / 2
            return (
              <g key={`${e.from}-${e.to}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--blue)" strokeWidth="1.5" markerEnd="url(#arrow)" opacity="0.9" />
                <text
                  x={mx}
                  y={my}
                  fontSize="12"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fill="var(--text)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  stroke="var(--bg-raised)"
                  strokeWidth="5"
                  paintOrder="stroke"
                >
                  {e.labels.join(', ')}
                </text>
              </g>
            )
          })}

          {loops.map((e) => {
            const [x, y] = POS[e.from]
            const a = x + W - 44
            const b = x + W - 8
            return (
              <g key={`loop-${e.from}`}>
                <path d={`M ${a} ${y} C ${a} ${y - 34} ${b} ${y - 34} ${b} ${y}`} fill="none" stroke="var(--blue)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <text x={(a + b) / 2} y={y - 32} fontSize="12" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill="var(--text)" textAnchor="middle" stroke="var(--bg-raised)" strokeWidth="5" paintOrder="stroke">
                  {e.labels.join(', ')}
                </text>
              </g>
            )
          })}

          {TABLES.map((t) => {
            const [x, y] = POS[t.code]
            const isolated = t.references.length === 0 && !all.some((e) => e.to === t.code)
            return (
              <g key={t.code}>
                <rect x={x} y={y} width={W} height={H} rx="8" fill="var(--bg-card)" stroke={isolated ? 'var(--line)' : 'var(--line-bright)'} strokeWidth="1" />
                <text x={x + W / 2} y={y + 16} fontSize="13" fontWeight="600" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill="var(--text)" textAnchor="middle">
                  {t.code}
                </text>
                <text x={x + W / 2} y={y + 31} fontSize="11" fill="var(--text-dim)" textAnchor="middle">
                  {SHORT[t.code]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <figcaption className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-faint)]">
        The 22 references the EBA data model declares, drawn from the taxonomy file rather than typed. An arrow
        runs from the table that refers to a value to the table that defines it; the label is the EBA&apos;s own
        reference number, which is what a rule 807 message quotes. B_01.01 and B_99.01 take part in no reference.
      </figcaption>
    </figure>
  )
}
