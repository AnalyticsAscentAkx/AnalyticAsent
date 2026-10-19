// Labels shared by server pages and client components. Kept apart from
// really-european.ts so a client component that only needs a label does not
// pull the whole dataset into the browser bundle.

export type Verdict = 'eu-controlled' | 'non-eu-controlled' | 'pe-controlled' | 'unverified'

export const VERDICT_LABEL: Record<Verdict, string> = {
  'eu-controlled': 'EU-controlled',
  'non-eu-controlled': 'Non-EU-controlled',
  'pe-controlled': 'PE-controlled',
  unverified: 'Unverified',
}
