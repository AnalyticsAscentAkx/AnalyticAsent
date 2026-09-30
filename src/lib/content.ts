// Everything the site says about the work, in one place.
//
// No client is named anywhere, by sector or by size only. Figures are the ones
// that were actually measured; where a number is modelled rather than banked,
// it says so, because a case study that overstates is worse than one that is
// merely short.

export interface Capability {
  slug: string
  title: string
  lede: string
  detail: string
  proof: string
}

export const CAPABILITIES: Capability[] = [
  {
    slug: 'part-matching',
    title: 'Part matching and should-cost benchmarking',
    lede: 'Price a new enquiry from the parts you have already quoted.',
    detail:
      'Contract manufacturers hold years of quotes and almost never use them. An estimator searches by memory, so the same part gets priced three different ways in a year. Matching a new enquiry against historical parts on physical attributes — material family, envelope, tolerance, finish, quantity — turns that archive into a price anchor, in seconds, with the reasoning shown.',
    proof: '95% recall on held-out parts · ±36.5% median price error',
  },
  {
    slug: 'route-optimisation',
    title: 'Route and collection optimisation',
    lede: 'Fewer runs, the same tonnage.',
    detail:
      'Collection economics live or die on assumptions nobody re-checks: payload, round length, subcontract rate. Rebuilding the operating model from vehicle class upward — then optimising the rounds against it — usually moves the answer further than any routing software will.',
    proof: 'Rebuilt model turned a projected loss into profit on the same fleet',
  },
  {
    slug: 'inventory',
    title: 'Inventory and demand planning',
    lede: 'Stock that reflects demand instead of last year.',
    detail:
      'An MRP run tells you what the parameters say. It does not tell you whether the parameters are right. The work is separating genuine demand signal from reorder noise, sizing safety stock against measured variability rather than a flat rule, and giving planners a reason to trust the number.',
    proof: 'Component-level forecasting across a multi-warehouse network',
  },
  {
    slug: 'pricing',
    title: 'Pricing and bidding models',
    lede: 'Know what a slot is worth before you bid on it.',
    detail:
      'Auction-based inventory rewards whoever estimates value most accurately, not whoever bids hardest. That means modelling conversion by placement, time and geography, then setting bids from expected value with a ceiling that is enforced rather than hoped for.',
    proof: 'Live bidding across a consumer marketplace I own and operate',
  },
  {
    slug: 'data-platform',
    title: 'Data engineering and internal tooling',
    lede: 'Pipelines, warehouses, and the small tools that remove daily friction.',
    detail:
      'Most analytics problems are plumbing problems wearing a hat. Modelled warehouses, tested transformations, scheduled jobs that fail loudly — plus the unglamorous extensions and parsers that save a team an hour a day and never make a roadmap.',
    proof: 'Browser extension fixing legacy ERP exports, used daily',
  },
  {
    slug: 'decision-support',
    title: 'Decision support and modelling',
    lede: 'A model you can argue with.',
    detail:
      'Board papers and business cases built so the assumptions are visible and every figure is traceable to a source. If the answer changes when an assumption changes, that should be a slider, not a rebuild.',
    proof: 'Operating models, scenario analysis, and the paper that carries them',
  },
]

export interface CaseStudy {
  slug: string
  sector: string
  title: string
  problem: string
  approach: string
  outcome: string
  metrics: { value: string; label: string }[]
  tags: string[]
  href?: string
  hrefLabel?: string
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'quote-matching',
    sector: 'Aerospace machining',
    title: 'Turning five years of quotes into a price anchor',
    problem:
      'Estimators priced new enquiries by searching old quotes from memory. Nothing was reused systematically, so similar parts left the building at inconsistent prices and every enquiry cost hours.',
    approach:
      'Matched each new part against historical ones on attributes known at quote time — material family, envelope, tolerance, feature count, quantity — rather than on cost fields a new enquiry does not have. Weights were tuned against held-out parts, and the engine refuses to answer when nothing close enough exists.',
    outcome:
      'A public, self-serve version runs entirely in the browser, so a shop can try it on its own history without the file leaving the machine.',
    metrics: [
      { value: '95%', label: 'recall at ten on held-out parts' },
      { value: '±36.5%', label: 'median price error' },
      { value: '<1s', label: 'per enquiry' },
    ],
    tags: ['Part matching', 'Nearest neighbours', 'Browser-side'],
    href: '/cm-optimiser',
    hrefLabel: 'Try the tool',
  },
  {
    slug: 'waste-routes',
    sector: 'Waste and recycling',
    title: 'A collection business that was not losing money after all',
    problem:
      'The operating plan showed a loss and the conclusion was that the contract was unviable. The plan rested on three assumptions that had never been checked against the vehicles actually in the yard.',
    approach:
      'Rebuilt the model from gross vehicle weight upward. Payload had been understated by nearly a third, which cascaded into route counts, fuel, driver hours and disposal trips. Re-optimised the rounds against the corrected payload and re-derived the subcontract rate.',
    outcome:
      'The corrected model turned a projected loss into a profit at a defensible rate, with every assumption traceable and adjustable.',
    metrics: [
      { value: '31%', label: 'fewer collection rounds a year' },
      { value: '3', label: 'assumptions driving the whole gap' },
      { value: 'Loss → profit', label: 'on the same fleet' },
    ],
    tags: ['Route optimisation', 'Operating model', 'Unit economics'],
  },
  {
    slug: 'parking',
    sector: 'Consumer marketplace — my own product',
    title: 'A live mobility site priced on public data',
    problem:
      'Drivers and EV owners cannot easily find what a stop actually costs: the electricity, the parking underneath it, and the cheaper option a short walk away are quoted in three different places, if at all.',
    approach:
      'Built and run a consumer site over national open data — every public charge point and register-listed garage, priced for a specific stop. Revenue comes from affiliate and auction-based placements, which means modelling what a click is worth by placement and geography rather than bidding flat.',
    outcome:
      'Live, indexed and growing, and the clearest proof I ship and operate rather than only advise.',
    metrics: [
      { value: '196k', label: 'public charge points, live status' },
      { value: '323', label: 'garages and P+R sites with official tariffs' },
      { value: '14', label: 'cities compared' },
    ],
    tags: ['Product', 'Open data', 'Bidding models', 'SEO'],
    href: 'https://parkingnetherlands.com',
    hrefLabel: 'Visit the site',
  },
  {
    slug: 'inventory',
    sector: 'Hardware manufacturing',
    title: 'Telling demand signal apart from reorder noise',
    problem:
      'Planning ran on MRP output nobody fully trusted. Warehouses held stock that did not reflect demand, and the gap between what the system said and what planners did was widening.',
    approach:
      'Separated genuine demand from replenishment artefacts at component level, sized safety stock against measured variability instead of a flat rule, and made the forecast explain itself so planners could see why a number moved.',
    outcome:
      'A component-level view across the warehouse network that planners could challenge, and a clear account of where MRP alone was never going to be enough.',
    metrics: [
      { value: 'Component', label: 'level forecasting, not category level' },
      { value: 'Multi-site', label: 'warehouse network' },
      { value: 'Variability', label: 'based safety stock' },
    ],
    tags: ['Forecasting', 'Inventory', 'Supply chain'],
  },
  {
    slug: 'erp-tooling',
    sector: 'Internal tooling',
    title: 'The hour a day nobody had budgeted for',
    problem:
      'A finance team exported from its ERP daily. The export was a legacy format that modern spreadsheets open with a warning and mangle on save, so every report began with the same manual repair.',
    approach:
      'A browser extension that intercepts the download and converts it in place, plus a query console and a parser for the same platform. None of it is clever. All of it removes a step that was costing real time every single day.',
    outcome:
      'The repair step disappeared. The tools are the kind that never reach a roadmap because no one logs them as a problem.',
    metrics: [
      { value: 'Daily', label: 'manual repair step removed' },
      { value: '3', label: 'tools across one ERP platform' },
      { value: 'In-place', label: 'conversion, no workflow change' },
    ],
    tags: ['Internal tools', 'ERP', 'Browser extension'],
  },
  {
    slug: 'lead-pipeline',
    sector: 'B2B growth',
    title: 'A qualified pipeline built from public sources',
    problem:
      'Outbound was guesswork. There was no defensible list of who was worth contacting, so effort went wherever attention happened to land.',
    approach:
      'Built a crawler and enrichment pipeline over public registries and company data, with deliberate rate limits and a qualification model that scored fit rather than just collecting rows.',
    outcome:
      'Thousands of qualified leads with the reasoning attached, and a repeatable pipeline rather than a one-off scrape.',
    metrics: [
      { value: '5,792', label: 'qualified leads delivered' },
      { value: 'Public', label: 'sources only' },
      { value: 'Repeatable', label: 'not a one-off scrape' },
    ],
    tags: ['Data acquisition', 'Enrichment', 'Go-to-market'],
  },
]

export interface Series {
  title: string
  blurb: string
  count: number
  sample: string[]
}

export const WRITING: Series[] = [
  {
    title: 'Two-Minute Python',
    blurb: 'One tool, one decision, one sitting. No tutorials that need a weekend.',
    count: 6,
    sample: ['Stop using pip install', 'conda vs uv in 2026', 'What pyproject.toml is actually for'],
  },
  {
    title: 'Stats in 120 Seconds',
    blurb: 'The statistics that decide business questions, minus the notation.',
    count: 6,
    sample: ['When the median lies', 'Standard deviation vs standard error', 'Why your A/B test needs 16× the sample'],
  },
  {
    title: 'LLM Gotcha of the Week',
    blurb: 'Things language models get confidently wrong, and what to do instead.',
    count: 4,
    sample: ['LLMs cannot count rows', 'Temperature zero is not deterministic', 'Ask for pairs, not ratings'],
  },
  {
    title: 'Kaggle Field Notes',
    blurb: 'Competition work, written down while it is still inconvenient.',
    count: 2,
    sample: ['Your first submission', 'The baseline that beats most notebooks'],
  },
]

export const LINKS = {
  medium: 'https://medium.com/@craakash',
  substack: 'https://craakash.substack.com/',
  parking: 'https://parkingnetherlands.com',
}
