// The findings in the shape the EBA sends them back.
//
// A detailed-feedback.csv from the real system has the header
// templateCode,rowCode/rowNumber,columnCode,ruleCode,message,offendingValue
// and lower-case template codes (b_05_01). Matching that exactly means the
// file from this page can be diffed against the file from the supervisor,
// and dropped into whatever a team already built to triage the official one.

import { csvEscape } from './csv'
import type { Finding } from './types'

export function toFeedbackCsv(findings: Finding[]): string {
  const header = 'templateCode,rowCode/rowNumber,columnCode,ruleCode,message,offendingValue,severity'
  const lines = findings.map((f) =>
    [
      f.template === 'package' ? 'package' : f.template.toLowerCase().replace('.', '_'),
      f.row !== undefined ? String(f.row) : '',
      f.column ?? '',
      f.rule,
      f.message,
      f.value ?? '',
      f.severity,
    ]
      .map(csvEscape)
      .join(','),
  )
  return [header, ...lines].join('\n') + '\n'
}

export interface RuleGroup {
  rule: string
  severity: Finding['severity']
  layer: Finding['layer']
  template: string
  count: number
  /** First message, used as the group's headline. */
  message: string
  examples: Finding[]
}

/** Group by rule and template so a 40,000-row register with one systematic
 *  mistake shows one line with a count, not 40,000 lines. */
export function groupFindings(findings: Finding[], examplesPer = 5): RuleGroup[] {
  const map = new Map<string, RuleGroup>()
  for (const f of findings) {
    const key = `${f.rule}|${f.template}|${f.layer}`
    let g = map.get(key)
    if (!g) {
      g = { rule: f.rule, severity: f.severity, layer: f.layer, template: f.template, count: 0, message: f.message, examples: [] }
      map.set(key, g)
    }
    g.count++
    if (g.examples.length < examplesPer) g.examples.push(f)
  }
  const sevRank = { reject: 0, warning: 1, insight: 2 }
  return [...map.values()].sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || b.count - a.count)
}
