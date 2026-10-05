import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site'

// The site had no robots.txt at all, which left crawling entirely to guesswork
// and gave search engines no route to the sitemap.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Only the downloads are blocked. /_next/ was blocked here too, which
        // was a mistake: it holds the JavaScript and CSS Google needs to render
        // the page, and Google does not index those as pages anyway. Blocking
        // them leaves the crawler looking at an unrendered shell, which is one
        // of the ways a page ends up "crawled, currently not indexed".
        disallow: ['/cm-optimiser/downloads/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
