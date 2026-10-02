import { SITE_URL } from '@/lib/site'

// Structured data, for the crawlers that will not read prose.
//
// The Dataset block is the interesting one. Google runs a separate index for
// datasets — Dataset Search — fed almost entirely by schema.org/Dataset markup,
// and competition in it is a fraction of ordinary web search because most sites
// publishing data never declare it. A downloadable CSV with a licence and a
// described method is exactly what that index wants, so it is close to free
// distribution for the one page built to be downloaded.

const ORG = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Analytics Ascent',
  url: SITE_URL,
  description:
    'Analytics and optimisation for operations: part matching and should-cost benchmarking, route and collection optimisation, inventory planning, pricing and bidding models.',
  founder: {
    '@type': 'Person',
    name: 'Dr Aakash Chavan',
    sameAs: 'https://www.linkedin.com/in/aakashcr/',
  },
  sameAs: ['https://craakash.substack.com/', 'https://www.linkedin.com/in/aakashcr/'],
}

export function SiteStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      ORG,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Analytics Ascent',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export interface DatasetMeta {
  name: string
  description: string
  path: string
  files: { name: string; description: string }[]
  keywords: string[]
  /** ISO date the data was last rebuilt. */
  modified: string
  measurementTechnique?: string
}

export function DatasetStructuredData({ dataset }: { dataset: DatasetMeta }) {
  const url = `${SITE_URL}${dataset.path}`
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: dataset.name,
    description: dataset.description,
    url,
    keywords: dataset.keywords,
    dateModified: dataset.modified,
    isAccessibleForFree: true,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: ORG,
    publisher: { '@id': `${SITE_URL}/#organization` },
    measurementTechnique: dataset.measurementTechnique,
    distribution: dataset.files.map((f) => ({
      '@type': 'DataDownload',
      name: f.name,
      description: f.description,
      encodingFormat: 'text/csv',
      contentUrl: `${url}/downloads/${f.name}`,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function SoftwareStructuredData({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: `${SITE_URL}${path}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any modern browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    creator: ORG,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
