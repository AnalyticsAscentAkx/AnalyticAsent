// What is for sale, at what price, and where the money goes.
//
// Payment runs through Stripe Payment Links: a hosted checkout page per
// product, created in the Stripe account, no secret on this site and nothing
// for the page to process. Paste each link's URL into `stripe` below. Until a
// link is set, the button for that package sends the visitor to the contact
// form with the package named, so nothing on the page is ever a dead end.
//
// Prices are in euros, exclusive of VAT. The one-off packages are paid in full
// at checkout; the remediation package takes a deposit at checkout and the
// balance is quoted after a look at the register, because its size is not
// knowable from the outside.

export interface Package {
  id: string
  name: string
  /** One line: who it is for. */
  line: string
  price: number
  /** 'once' or 'quarter'. */
  per: 'once' | 'quarter'
  /** Shown instead of the price when the price is a deposit. */
  deposit?: boolean
  /** What they get, in the order it happens. */
  scope: string[]
  /** How long it takes once the register is in hand. */
  turnaround: string
  /** Stripe Payment Link. Empty routes to the contact form. */
  stripe: string
  /** Subject carried to the contact form. */
  subject: string
  /** Button label. */
  cta: string
}

export const PACKAGES: Package[] = [
  {
    id: 'check-solo',
    name: 'Pre-submission check',
    line: 'One financial entity, one register, before it goes to the supervisor.',
    price: 2900,
    per: 'once',
    scope: [
      'Your register run through the full rule set, with the GLEIF step',
      'Every finding reviewed by a person and ranked by what gets the file rejected',
      'A written remediation list, row by row, with the fix for each',
      'The report and the detailed-feedback.csv, yours to keep',
      'A one-hour call to walk through it',
    ],
    turnaround: 'Three working days from receiving the register.',
    stripe: '',
    subject: 'Pre-submission check (one entity)',
    cta: 'Book the check',
  },
  {
    id: 'check-group',
    name: 'Pre-submission check, group',
    line: 'A consolidated register covering several entities, branches and intra-group providers.',
    price: 6900,
    per: 'once',
    scope: [
      'Everything in the single-entity check, across the whole group register',
      'The intra-group chain checked end to end: B_02.03 links, B_03.03 signers, provider rows for every group company',
      'Ultimate parents reconciled against what each provider has filed with GLEIF',
      'A concentration readout by group, with the EU benchmark',
      'A ninety-minute call with the people who own the register',
    ],
    turnaround: 'Five working days from receiving the register.',
    stripe: '',
    subject: 'Pre-submission check (group)',
    cta: 'Book the group check',
  },
  {
    id: 'remediation',
    name: 'Register remediation',
    line: 'For a register that has come back from the supervisor, or will not pass the check.',
    price: 2500,
    per: 'once',
    deposit: true,
    scope: [
      'Every provider resolved to an LEI or EUID and to its real ultimate parent, with the evidence',
      'Functions, criticality and the B_07.01 assessments made consistent across the templates',
      'Placeholders replaced or documented, as the supervisor will ask',
      'The CSV package rebuilt from your workbook and run clean through the checker',
      'Scoped after a first look: the deposit is set against the quoted fee',
    ],
    turnaround: 'Quoted after a first look; typically two to four weeks.',
    stripe: '',
    subject: 'Register remediation',
    cta: 'Start with a deposit',
  },
  {
    id: 'report',
    name: 'Concentration report',
    line: 'The register read back to the board every quarter, with new contracts checked against it.',
    price: 2400,
    per: 'quarter',
    scope: [
      'A board paper from the register: expense by group, critical services by provider, data locations, exit-plan coverage',
      'Your figures against the EU landscape and, as it builds, against other participants',
      'New and changed arrangements checked against the register before they are entered',
      'The annual submission run through the pre-submission check at no extra charge',
      'Cancel at any quarter end',
    ],
    turnaround: 'First paper within three weeks; then each quarter.',
    stripe: '',
    subject: 'Quarterly concentration report',
    cta: 'Start the quarterly report',
  },
]

export const eur = (n: number) => `€${n.toLocaleString('en-GB')}`

/** Where a package's button goes: the hosted checkout if set, the contact form otherwise. */
export function packageHref(p: Package): string {
  return p.stripe || `/contact?subject=${encodeURIComponent(p.subject)}`
}
