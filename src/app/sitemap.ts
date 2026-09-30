import type { MetadataRoute } from 'next'

// Nothing here varies per request, so it is generated once at build time.
export const dynamic = 'force-static'

import { SITE_URL } from '@/lib/site'

// Priorities are relative to each other, not absolute scores. The tool ranks
// alongside the home page because it is the thing worth finding.

const PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '', changeFrequency: 'monthly', priority: 1.0 },
  { path: '/cm-optimiser', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/client-analytics', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/insights', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
