import type { MetadataRoute } from 'next'

// Nothing here varies per request, so it is generated once at build time.
export const dynamic = 'force-static'

import { SITE_URL } from '@/lib/site'

// The site had no robots.txt at all, which left crawling entirely to guesswork
// and gave search engines no route to the sitemap.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Static assets and downloads are not pages; indexing them buries the
        // pages that matter under CSVs and JSON.
        disallow: ['/cm-optimiser/downloads/', '/_next/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
