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
    proof: '95% recall on held-out parts, ±36.5% median price error',
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
      'Auction-based inventory rewards whoever estimates value most accurately, not whoever bids hardest. That means tying auction outcomes back to what happened afterwards — at the level of the individual listing, not the campaign — then setting bids from expected value, with a ceiling that is enforced rather than hoped for.',
    proof: 'Auction bidding at scale, and a consumer marketplace of our own',
  },
  {
    slug: 'financial-modelling',
    title: 'Financial modelling and unit economics',
    lede: 'Know which number the whole case actually turns on.',
    detail:
      'Most business cases are one assumption wearing a spreadsheet. Build the P&L from the physical facts upward — what a unit costs to make, move and dispose of — and the break-even falls out of it rather than being argued towards. Done properly it also tells you what rate to negotiate, which sites to keep, and how wrong an input can be before the answer changes.',
    proof: 'A rebuilt operating model that turned a projected loss into a profit',
  },
  {
    slug: 'document-classification',
    title: 'Document extraction and classification',
    lede: 'Get the number off page sixty, and show your working.',
    detail:
      'The figure you need is in a table in a PDF, and it has to land in a category somebody else defined. Doing it once is easy and doing it at volume consistently is not, because the judgement calls stop being visible. We split the job: deterministic code does ingestion, parsing, unit and currency conversion and assembly, a model does the reading and the classification, and rules are written at category level so nothing gets a bespoke carve-out. Every decision keeps the reason and the page it came from.',
    proof: 'Rejected findings published alongside accepted ones, with reasons',
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

/** A figure attached to a case study. Only present where real measured data
 *  exists — three of the six have one, and inventing the other three would
 *  undo the point of publishing measured numbers in the first place. */
export type CaseChart =
  | {
      kind: 'compare'
      points: { label: string; value: number; state?: 'before' | 'after'; display?: string }[]
      caption: string
      unit?: string
    }
  | {
      kind: 'sensitivity'
      points: { x: number; y: number }[]
      xLabel: string
      yLabel: string
      caption: string
      markerAt?: number
    }
  | {
      kind: 'histogram'
      bins: { label: string; count: number }[]
      caption: string
      xLabel?: string
    }

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
  /** True where the link points at something we own. Those links keep the
   *  referrer so the destination's own analytics can see the traffic;
   *  noreferrer is for sending people to other people's sites. */
  ownProduct?: boolean
  chart?: CaseChart
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
    chart: {
      kind: 'compare',
      points: [
        { label: 'Untuned', value: 82.2, state: 'before', display: '82.2%' },
        { label: 'Tuned', value: 95.0, state: 'after', display: '95.0%' },
        { label: 'Raw input', value: 71.5, state: 'before', display: '71.5%' },
        { label: 'Enriched', value: 94.1, state: 'after', display: '94.1%' },
      ],
      caption:
        'Recall at ten on 1,000 held-out parts. Tuning the feature weights is worth 12.8 points; parsing messy material and dimension strings before matching is worth 22.6 more.',
    },
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
      'The corrected model turned a projected loss into a profit at a defensible rate, and answered the questions that followed from it: break-even per vehicle, what to pay a subcontractor, and which sites were worth keeping. Every assumption is traceable and adjustable.',
    metrics: [
      { value: '31%', label: 'fewer collection rounds a year' },
      { value: '3', label: 'assumptions driving the whole gap' },
      { value: 'Loss → profit', label: 'on the same fleet' },
    ],
    tags: ['Financial modelling', 'Unit economics', 'Break-even', 'Route optimisation'],
    chart: {
      kind: 'sensitivity',
      points: Array.from({ length: 15 }, (_, i) => {
        const payload = 1.2 + i * 0.1
        return { x: Math.round(payload * 10) / 10, y: Math.round(682.5 / payload) }
      }),
      xLabel: 't payload',
      yLabel: 'rounds a year',
      markerAt: 2.2,
      caption:
        'Rounds needed a year against payload per truck. The plan assumed 1.5t; the vehicles carry 2.2t. Everything downstream — fuel, driver hours, disposal trips — moves with this one number.',
    },
  },
  {
    slug: 'metasearch-bidding',
    sector: 'Global online marketplace',
    title: 'Knowing what an auction placement is actually worth',
    problem:
      'When placement is sold by auction, bidding low puts you under the fold on a page the customer had already decided to buy from, and bidding high means paying retail for demand that was coming anyway. What a placement is worth varies by listing, by market and by device — none of which is visible from the bid side.',
    approach:
      'Matched auction outcomes back to what happened afterwards, at the level of the individual listing rather than the campaign: the position won, the price shown beside the competition, and whether it converted. Bids then follow expected value rather than a flat rule, which is the only way one budget behaves differently in a market you are already winning than in one you are not.',
    outcome:
      'Bidding logic and the reporting behind it, running across several placement channels at once.',
    metrics: [
      { value: 'Listing', label: 'level bidding, not campaign level' },
      { value: 'Expected', label: 'value, not a flat rule' },
      { value: 'Multi', label: 'channel, bid simultaneously' },
    ],
    tags: ['Bidding models', 'Auction data', 'Expected value'],
  },
  {
    slug: 'parking',
    sector: 'Consumer marketplace — our own product',
    title: 'parkingnetherlands.com: a live mobility site priced on public data',
    problem:
      'Drivers and EV owners cannot easily find what a stop actually costs: the electricity, the parking underneath it, and the cheaper option a short walk away are quoted in three different places, if at all.',
    approach:
      'Built and run a consumer site over national open data — every public charge point and register-listed garage, priced for a specific stop. Revenue comes from affiliate and auction-based placements, which means modelling what a click is worth by placement and geography rather than bidding flat.',
    outcome:
      'parkingnetherlands.com is live, indexed and growing — the clearest proof we ship and operate rather than only advise. The tariff chart below is its own data: median first-hour price across the fourteen cities it covers.',
    metrics: [
      { value: '196k', label: 'public charge points, live status' },
      { value: '323', label: 'garages and P+R sites with official tariffs' },
      { value: '14', label: 'cities compared' },
    ],
    tags: ['Product', 'Open data', 'Bidding models', 'SEO'],
    href: 'https://parkingnetherlands.com/',
    hrefLabel: 'parkingnetherlands.com',
    ownProduct: true,
    chart: {
      kind: 'histogram',
      bins: [
        { label: 'Eindhoven', count: 1.5 },
        { label: 'Leiden', count: 1.9 },
        { label: 'Tilburg', count: 2.0 },
        { label: 'Breda', count: 2.0 },
        { label: 'Rotterdam', count: 2.0 },
        { label: 'Maastricht', count: 2.17 },
        { label: 'Groningen', count: 2.25 },
        { label: 'Zwolle', count: 2.73 },
        { label: 'Nijmegen', count: 2.9 },
        { label: 'Amsterdam', count: 3.0 },
        { label: 'The Hague', count: 3.2 },
        { label: 'Haarlem', count: 3.49 },
        { label: 'Utrecht', count: 3.58 },
        { label: 'Delft', count: 3.64 },
      ],
      xLabel: '€ median first hour',
      caption:
        'Median first-hour tariff across the fourteen cities the site covers. Amsterdam is not the expensive one — a result that only shows up once every garage tariff is in one place.',
    },
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

// Writing lives in lib/writing.ts now — those are the pieces that are actually
// published, rather than a plan for a series that was never shipped.

export const LINKS = {
  // One publishing channel, deliberately. The same pieces were cross-posted
  // elsewhere, but Substack is the one that owns the subscriber relationship,
  // and two platform badges read as hedging rather than as a body of work.
  substack: 'https://craakash.substack.com/',
  substackSubscribe: 'https://craakash.substack.com/subscribe',
  parking: 'https://parkingnetherlands.com/',
}

/** The publication, as it describes itself. */
export const PUBLICATION = {
  name: 'Data, Money & Life',
  tagline:
    'Python, data engineering and money. Working code, real numbers, and the occasional post about what did not work.',
  since: 'January 2025',
}
