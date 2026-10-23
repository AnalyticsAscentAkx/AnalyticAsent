import type { MetadataRoute } from 'next'

import { GUIDES, guidePath } from '@/lib/guides'
import { FEATURED } from '@/lib/really-european'
import { SITE_URL } from '@/lib/site'

// Priorities are relative to each other, not absolute scores. The tool ranks
// alongside the home page because it is the thing worth finding.

const PAGES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '', changeFrequency: 'monthly', priority: 1.0 },
  { path: '/dora-register', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/dora-services', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/cm-optimiser', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/work', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/data-clinic', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/tools', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/afterlabel', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/unit-economics', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/datasets/who-owns-what', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/really-european', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/really-european/check', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/really-european/badge', changeFrequency: 'monthly', priority: 0.5 },
  ...FEATURED.map((r) => ({ path: `/really-european/${r.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  { path: '/dora/providers', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/guides', changeFrequency: 'monthly', priority: 0.9 },
  ...GUIDES.map((g) => ({ path: guidePath(g.slug), changeFrequency: 'monthly' as const, priority: 0.9 })),
  { path: '/services', changeFrequency: 'monthly', priority: 0.8 },
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
