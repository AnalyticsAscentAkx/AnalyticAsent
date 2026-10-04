// One place for the canonical origin. Three spellings of this domain exist in
// the project's history (analyticascent.com, analytics-ascent.com and
// analytic-ascent.com); this is the one the site is actually served from, and
// canonical URLs, the sitemap and robots.txt all derive from it.

export const SITE_URL = 'https://analyticascent.com'


import type { Metadata } from 'next'

/** Per-page metadata with the social card attached.
 *
 *  Next.js does not deep-merge `openGraph`: a page that defines its own
 *  replaces the root's entirely, and the file-based opengraph-image goes with
 *  it. That failure is invisible — the page builds, the tags look present, and
 *  only the preview is blank. Routing every page through here means the image
 *  cannot be dropped by accident. */
export function pageMetadata(opts: {
  title: string
  description: string
  path: string
  ogTitle?: string
  keywords?: string[]
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    ...(opts.keywords ? { keywords: opts.keywords } : {}),
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.ogTitle ?? opts.title,
      description: opts.description,
      url: opts.path,
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.ogTitle ?? opts.title,
      description: opts.description,
      images: ['/opengraph-image'],
    },
  }
}
