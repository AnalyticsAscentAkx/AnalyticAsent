// Published writing.
//
// These are the pieces that actually exist on Medium and Substack, not a
// publishing plan. Each hook is written for this page rather than pulled from
// the feed, because a feed excerpt is usually the first line of the article and
// the first line of an article is rarely the reason to read it.

export interface Article {
  title: string
  href: string
  date: string
  hook: string
  /** Set where a piece is the written-up version of work shown elsewhere on
   *  the site, so the two can point at each other. */
  relatedTo?: { label: string; href: string }
}

export interface ArticleGroup {
  slug: string
  title: string
  blurb: string
  articles: Article[]
}

export const FEATURED: Article[] = [
  {
    title: 'Route optimisation in Python: the delivery route problem with simulated annealing',
    href: 'https://craakash.substack.com/p/route-optimization-in-python-solving-the-delivery-route-problem-with-simulated-annealing-dd564a22e275',
    date: '2025-03-04',
    hook: 'The method behind the collection-rounds work, written out in full: why a greedy route is almost never the good one, and how letting the solver accept a worse answer early is what gets it to a better one later. The animation at the top of this site is this algorithm, running.',
    relatedTo: { label: 'the collection-rounds case study', href: '/work' },
  },
  {
    title: 'Building an automated pipeline for Dutch vehicle open data',
    href: 'https://craakash.substack.com/p/unlocking-the-dutch-vehicle-market-building-an-automated-pipeline-for-rdw-open-data-in-bigquery-8c95a7d93f31',
    date: '2025-07-15',
    hook: 'A national open dataset turned into something queryable, scheduled and actually usable. The same approach underneath the mobility site — public data is only free if you are willing to do the engineering.',
    relatedTo: { label: 'the mobility product', href: 'https://parkingnetherlands.com' },
  },
  {
    title: 'The hidden cost of premature rounding',
    href: 'https://craakash.substack.com/p/the-hidden-cost-of-premature-rounding-a-quantitative-analysis-from-arithmetic-to-machine-learning-fcdcb074062a',
    date: '2025-08-05',
    hook: 'Where a rounded intermediate quietly becomes a wrong answer, traced from plain arithmetic through to model output. The closest thing here to a manifesto: most bad numbers are not wrong calculations, they are careless ones.',
  },
]

export const GROUPS: ArticleGroup[] = [
  {
    slug: 'llm-tooling',
    title: 'Working with language models',
    blurb:
      'Less about what the models can do, more about what they cost and where they quietly fail.',
    articles: [
      {
        title: 'I built a Claude Code model router to cut token costs. Then I measured it.',
        href: 'https://craakash.substack.com/p/i-built-a-claude-code-model-router-to-cut-token-costs-then-i-measured-it-c20ee11cae3a',
        date: '2026-09-16',
        hook: 'A weekend plugin, eight controlled runs, and a breakeven number that made me use the thing far less than I had planned. Publishing the disappointing result is the point.',
      },
      {
        title: 'I use Claude in the terminal and I am never going back — but one thing was missing',
        href: 'https://craakash.substack.com/p/i-use-claude-in-the-terminal-and-im-never-going-back-but-one-thing-was-missing-f5fac6c0ced5',
        date: '2026-05-11',
        hook: 'Which led to undocumented API headers and a tool to fix what they exposed.',
      },
      {
        title: 'Reading and extracting data from PDFs, end to end',
        href: 'https://craakash.substack.com/p/how-to-read-and-extract-data-from-pdf-files-a-full-working-example-using-python-and-openai-3629da81834f',
        date: '2025-07-30',
        hook: 'A working example rather than a survey: PyMuPDF for the structure, a model for the parts that resist structure.',
      },
      {
        title: 'Replying to Google reviews automatically, with logging you can audit',
        href: 'https://craakash.substack.com/p/how-to-automatically-reply-to-google-reviews-using-chatgpt-and-google-cloud-with-full-python-code-72b334462c3c',
        date: '2025-03-02',
        hook: 'Automation that writes in public needs a record of what it said. Includes the BigQuery logging most versions of this leave out.',
      },
    ],
  },
  {
    slug: 'python',
    title: 'Python and SQL craft',
    blurb: 'Small things that remove a recurring irritation, written short on purpose.',
    articles: [
      {
        title: 'python -m is the flag most Python developers ignore',
        href: 'https://craakash.substack.com/p/python-m-is-the-flag-most-python-devs-ignore-and-it-fixes-your-import-errors-dbe6ca69793d',
        date: '2026-09-28',
        hook: 'python script.py breaks package imports. python -m fixes them. Two minutes, and it removes a class of error people work around for years.',
      },
      {
        title: 'crypto-yfinance: a Python library for cryptocurrency data',
        href: 'https://craakash.substack.com/p/crypto-yfinance-a-python-library-for-cryptocurrency-data-like-yfinance-but-for-crypto-3f7056d3f11e',
        date: '2025-08-21',
        hook: 'Built because the obvious library does not cover crypto and every workaround was worse than writing one.',
      },
      {
        title: 'SQL cheat sheet for data engineers: BigQuery and MySQL',
        href: 'https://craakash.substack.com/p/ultimate-sql-cheat-sheet-for-data-engineers-bigquery-mysql-9d6594eaa10d',
        date: '2025-02-08',
        hook: 'The two dialects side by side, for the moment you are certain a function exists and cannot recall which name it has here.',
      },
    ],
  },
  {
    slug: 'rigour',
    title: 'Numbers that mislead',
    blurb:
      'The recurring theme across everything else: the arithmetic is rarely the problem, the assumptions are.',
    articles: [
      {
        title: 'Models and the messy side of machine learning',
        href: 'https://craakash.substack.com/p/models-and-the-messy-side-of-machine',
        date: '2025-03-06',
        hook: 'The part of the job that does not appear in the tutorial: cleaning, deciding what a blank means, and discovering the label is wrong.',
      },
      {
        title: '50 data and analytics lessons from writing 50 articles',
        href: 'https://craakash.substack.com/p/50-data-analytics-lessons-from-writing-50-articles-b51438506f8f',
        date: '2025-03-06',
        hook: 'What fifty attempts at explaining this work taught me about the work itself.',
      },
      {
        title: 'Uncovering hidden topics with FABIA biclustering',
        href: 'https://craakash.substack.com/p/uncovering-hidden-topics-with-fabia-biclustering-in-python-a-hands-on-guide-using-kaggles-20-9d1b97cd5496',
        date: '2025-03-02',
        hook: 'Clustering rows and columns at once, for the case where a group only exists across some of the features and ordinary clustering walks straight past it.',
      },
      {
        title: 'How a 20 Questions toy outsmarted millions, and how to build one',
        href: 'https://craakash.substack.com/p/how-the-20-questions-toy-outsmarted-millions-and-how-you-can-build-your-own-ai-game-ebe215fbe154',
        date: '2025-07-16',
        hook: 'Information gain, explained through a plastic gadget from 1999 that genuinely felt like magic.',
      },
    ],
  },
  {
    slug: 'markets',
    title: 'Market and financial data',
    blurb: 'Mostly about where the data comes from, which decides everything downstream.',
    articles: [
      {
        title: '9 yfinance alternatives for reliable financial data',
        href: 'https://craakash.substack.com/p/9-best-yfinance-alternatives-for-reliable-financial-data-in-2025-b48b4aaa9ac9',
        date: '2025-08-14',
        hook: 'What to use once the free option starts failing on you mid-project.',
      },
      {
        title: '11 crypto data APIs and Python libraries worth using',
        href: 'https://craakash.substack.com/p/11-best-crypto-data-apis-and-python-libraries-for-reliable-market-data-in-2025-free-paid-50d369f52876',
        date: '2025-08-20',
        hook: 'Coverage, rate limits and what each one actually charges for.',
      },
      {
        title: 'Why you need an alternative to yfinance',
        href: 'https://craakash.substack.com/p/why-you-need-an-alternative-to-yfinance-a29abcdaf808',
        date: '2025-03-02',
        hook: 'The failure modes that only show up once a project depends on it.',
      },
      {
        title: 'Hidden Markov models and the Medallion fund',
        href: 'https://craakash.substack.com/p/hidden-markov-model-and-the-medilian-fund-a-deep-dive-into-market-prediction-035582a7f6a2',
        date: '2025-03-02',
        hook: 'Regime switching as a way of thinking about markets, and where the analogy stops being useful.',
      },
      {
        title: 'Optimising bank marketing strategies: a case study',
        href: 'https://craakash.substack.com/p/case-study-optimizing-bank-marketing-strategies-using-advanced-machine-learning-techniques-79feac2838f9',
        date: '2025-02-12',
        hook: 'A worked classification problem where the cost of a false positive and a false negative are nowhere near equal.',
      },
      {
        title: 'Family BV versus Box 3 taxation in the Netherlands',
        href: 'https://craakash.substack.com/p/the-attempted-understaning-family-bv-vs-box-3-taxation-in-the-netherlands-2025-d1965b472621',
        date: '2025-01-16',
        hook: 'An attempt to understand a genuinely confusing bit of Dutch tax treatment, with the arithmetic shown.',
      },
    ],
  },
]

export const ALL_ARTICLES = [...FEATURED, ...GROUPS.flatMap((g) => g.articles)]

export const RECENT = [...ALL_ARTICLES]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 4)

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}
