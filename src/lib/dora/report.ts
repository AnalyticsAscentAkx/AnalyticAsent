// A self-contained HTML report of the check, for the people who were not in
// the room: the risk committee, the auditor, the NCA correspondent.
//
// Plain HTML with inline CSS and no scripts, so it opens anywhere, prints to
// PDF from any browser, and can be attached to an email without a security
// team asking questions. Charts are CSS bars rather than SVG for the same
// reason: they survive every mail client's sanitiser.

import { benchmark, LANDSCAPE_SOURCE } from './benchmark'
import { groupFindings } from './feedback'
import type { Insight } from './insight'
import { CTPP_PUBLISHED } from './reference'
import { contractTable, functionTable, providerTable, serviceMix } from './tables'
import type { Finding, Register } from './types'

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const n0 = (v: number) => v.toLocaleString('en-GB', { maximumFractionDigits: 0 })
const pct = (v: number) => `${Math.round(v * 100)}%`

function bar(share: number, label: string, value: string, accent = true) {
  return `<div class="bar"><div class="bar-l">${esc(label)}</div><div class="bar-t"><span class="bar-f${accent ? '' : ' inert'}" style="width:${Math.max(1, Math.round(share * 100))}%"></span></div><div class="bar-v">${esc(value)}</div></div>`
}

function table(headers: string[], rows: (string | number)[][], numeric: number[] = []) {
  const th = headers.map((h, i) => `<th${numeric.includes(i) ? ' class="num"' : ''}>${esc(h)}</th>`).join('')
  const tr = rows
    .map((r) => `<tr>${r.map((c, i) => `<td${numeric.includes(i) ? ' class="num"' : ''}>${esc(c)}</td>`).join('')}</tr>`)
    .join('')
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`
}

export function buildReportHtml(opts: {
  reg: Register
  label: string
  findings: Finding[]
  insight: Insight
  gleifRun: boolean
}): string {
  const { reg, label, findings, insight: ins, gleifRun } = opts
  const counts = { reject: 0, warning: 0, insight: 0 }
  for (const f of findings) counts[f.severity]++
  const groups = groupFindings(findings, 3)
  const providers = providerTable(reg)
  const functions = functionTable(reg)
  const contracts = contractTable(reg)
  const mix = serviceMix(reg)
  const bench = benchmark(reg)
  const rows = Object.values(reg.tables).reduce((s, t) => s + t.rows.length, 0)
  const entity = reg.tables['B_01.01']?.rows[0]
  const entityName = entity ? entity[reg.tables['B_01.01'].header.indexOf('c0020')] : ''
  const refDate = reg.meta.parameters?.refPeriod ?? ''
  const today = new Date().toISOString().slice(0, 10)
  const verdict = counts.reject > 0 ? 'Would be rejected at reception' : counts.warning > 0 ? 'Would be accepted, with data-quality feedback' : 'Nothing to flag'
  const maxExp = Math.max(1, ...ins.byGroup.map((g) => g.expense))

  const css = `
  body{font:14px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:40px;max-width:1000px}
  h1{font-size:26px;margin:0 0 4px}h2{font-size:18px;margin:36px 0 10px;border-top:1px solid #ddd;padding-top:18px}h3{font-size:14px;margin:22px 0 8px}
  .sub{color:#666;margin:0 0 20px}.verdict{font-size:20px;font-weight:600;margin:18px 0 6px}
  .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:18px 0}.tile{border-top:1px solid #ddd;padding-top:8px}.tile b{font-size:24px;display:block}.tile span{color:#666;font-size:12px}
  table{border-collapse:collapse;width:100%;font-size:12.5px;margin:8px 0 16px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e5e5e5;vertical-align:top}th{color:#666;font-weight:500}.num{text-align:right;font-variant-numeric:tabular-nums}
  .bar{display:grid;grid-template-columns:260px 1fr 110px;gap:10px;align-items:center;margin:4px 0;font-size:12.5px}.bar-t{background:#eee;height:10px;border-radius:5px;overflow:hidden}.bar-f{display:block;height:100%;background:#3b82f6}.bar-f.inert{background:#94a3b8}.bar-v{text-align:right;font-variant-numeric:tabular-nums}
  .sev{display:inline-block;font-size:11px;padding:1px 6px;border-radius:3px;margin-right:6px}.sev.reject{background:#fde68a}.sev.warning{background:#dbeafe}.sev.insight{background:#eee}
  .finding{margin:10px 0;padding:8px 10px;border:1px solid #e5e5e5;border-radius:6px}.finding code{font-size:12px}.ex{color:#666;font-size:12px;margin-top:4px}
  .note{color:#666;font-size:12px}.foot{margin-top:40px;color:#666;font-size:12px;border-top:1px solid #ddd;padding-top:12px}
  @media print{body{padding:0}h2{break-after:avoid}.finding,tr{break-inside:avoid}}
  `

  const findingsHtml = (['reject', 'warning', 'insight'] as const)
    .map((sev) => {
      const gs = groups.filter((g) => g.severity === sev)
      if (gs.length === 0) return ''
      const title = { reject: 'Would be rejected at reception', warning: 'Data-quality feedback', insight: 'Worth a look' }[sev]
      return `<h3>${title} (${counts[sev]})</h3>${gs
        .map(
          (g) =>
            `<div class="finding"><span class="sev ${g.severity}">${g.rule}</span><b>${esc(g.template)}</b> · ${g.count} row${g.count === 1 ? '' : 's'}<div>${esc(g.message)}</div>${
              g.examples.some((e) => e.row !== undefined || e.value)
                ? `<div class="ex">${g.examples.map((e) => [e.row !== undefined ? `row ${e.row}` : '', e.column ?? '', e.value ?? ''].filter(Boolean).join(' · ')).join('<br>')}${g.count > g.examples.length ? `<br>… and ${g.count - g.examples.length} more in detailed-feedback.csv` : ''}</div>`
                : ''
            }</div>`,
        )
        .join('')}`
    })
    .join('')

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Register of Information check — ${esc(entityName || label)}</title><style>${css}</style></head><body>
<h1>Register of Information — pre-submission check</h1>
<p class="sub">${esc(entityName || label)}${refDate ? ` · reference date ${esc(refDate)}` : ''} · checked ${today} · ${Object.keys(reg.tables).length} of 15 templates, ${n0(rows)} rows${gleifRun ? ' · LEIs checked against GLEIF' : ' · GLEIF check not run'}</p>
<div class="verdict">${verdict}</div>
<div class="tiles">
<div class="tile"><b>${counts.reject}</b><span>would cause rejection</span></div>
<div class="tile"><b>${counts.warning}</b><span>data-quality findings</span></div>
<div class="tile"><b>${counts.insight}</b><span>worth a look</span></div>
<div class="tile"><b>${n0(ins.criticalFunctions)}/${n0(ins.functions)}</b><span>functions critical or important</span></div>
</div>

<h2>1. Where the dependence sits</h2>
<div class="tiles">
<div class="tile"><b>${n0(ins.entities)}</b><span>entities in scope</span></div>
<div class="tile"><b>${n0(ins.contracts)}</b><span>contractual arrangements</span></div>
<div class="tile"><b>${n0(ins.directProviders || ins.providers)}</b><span>direct providers (${n0(ins.providers)} listed)</span></div>
<div class="tile"><b>${n0(ins.criticalServiceRows)}</b><span>service rows supporting critical functions</span></div>
</div>
<h3>Annual expense by ultimate-parent group (${esc(ins.currency)}, direct providers)</h3>
${ins.byGroup.slice(0, 12).map((g) => bar(g.expense / maxExp, `${g.name}${g.intraGroup ? ' (intra-group)' : ''}${g.ctpp ? ' ★' : ''}`, `${n0(g.expense)} · ${pct(g.share)}`)).join('')}
<p class="note">★ on the ESAs' list of designated critical ICT third-party providers (${CTPP_PUBLISHED}). Herfindahl index of expense by group: ${ins.hhiGroup.toFixed(2)}. Largest single group holds ${pct(ins.topGroupShareOfCritical)} of critical service rows. ${pct(ins.cloudShareOfCritical)} of critical service rows are cloud (S17–S19).</p>

<h3>Service rows by ICT service type</h3>
${mix.map((m) => bar(m.rows / Math.max(1, mix[0]?.rows ?? 1), `${m.code} ${m.label}`, `${m.rows} rows · ${m.critical} critical`)).join('')}

<h3>Critical share by category, against the EU picture</h3>
<p class="note">EU figures: ${esc(LANDSCAPE_SOURCE.title)}, ${LANDSCAPE_SOURCE.date}; ${n0(LANDSCAPE_SOURCE.arrangements)} arrangements from about ${n0(LANDSCAPE_SOURCE.entities)} entities. The category mapping to S01–S19 is ours and approximate.</p>
${bench
  .map((b) => `${bar(b.category.criticalShare, `${b.category.label} — EU 2022`, pct(b.category.criticalShare), false)}${b.share === null ? `<div class="bar"><div class="bar-l">${esc(b.category.label)} — this register</div><div class="bar-t"></div><div class="bar-v">none</div></div>` : bar(b.share, `${b.category.label} — this register`, `${pct(b.share)} (${b.critical}/${b.rows})`)}`)
  .join('')}

<h3>Where the data sits at rest</h3>
${table(['Location', 'Status', 'Service rows', 'Of which critical'], ins.locations.map((l) => [l.label, l.cls, l.rows, l.criticalRows]), [2, 3])}

<h2>2. Providers</h2>
${table(
  ['Provider', 'Identifier', 'Country', 'Expense', 'Contracts', 'Services', 'Critical', 'Service types', 'Substitutability', 'Exit plan', 'Ultimate parent'],
  providers.map((p) => [`${p.name}${p.ctpp ? ' ★' : ''}${p.direct ? '' : ' (indirect)'}`, `${p.codeType} ${p.code}`, p.country, p.expense === null ? '' : `${n0(p.expense)} ${p.currency}`, p.contracts, p.services, p.criticalServices, p.serviceTypes.join(' '), p.substitutability, p.exitPlan, p.ultimateParentName]),
  [3, 4, 5, 6],
)}

<h2>3. Functions</h2>
${table(
  ['Id', 'Entity', 'Function', 'Licensed activity', 'Critical', 'Assessed', 'RTO h', 'RPO h', 'Impact', 'Services', 'Providers'],
  functions.map((f) => [f.id, f.entityName, f.name, f.activity, f.critical, f.assessed, f.rto, f.rpo, f.impact, f.services, f.providers]),
  [6, 7, 9, 10],
)}

<h2>4. Contractual arrangements</h2>
${table(
  ['Reference', 'Type', 'Overarching', 'Providers', 'Using entities', 'Expense', 'Start', 'End', 'Services', 'Critical', 'Service types'],
  contracts.map((c) => [c.ref, c.type, c.overarching, c.providers.join('; '), c.entities.join('; '), c.expense === null ? '' : `${n0(c.expense)} ${c.currency}`, c.start, c.end === '9999-12-31' ? 'open-ended' : c.end, c.services, c.criticalServices, c.serviceTypes.join(' ')]),
  [5, 8, 9],
)}

<h2>5. Findings (${findings.length})</h2>
<p class="note">Rule codes are the EBA's where one exists; AA- codes are checks the EBA does not run, resting on the ITS text. Full detail in detailed-feedback.csv.</p>
${findingsHtml || '<p>None.</p>'}

<div class="foot">Produced in the browser by the Analytics Ascent DORA Register Checker (analyticascent.com/dora-register). Checks follow the EBA technical checks and validation rules of 28 April 2025, the DORA 4.0 taxonomy and the ESAs RoI FAQ of 28 March 2025. The register was not uploaded; ${gleifRun ? 'the LEIs, and nothing else, were looked up at api.gleif.org.' : 'no network request was made.'} This is a checker, not legal advice.</div>
</body></html>`
}
