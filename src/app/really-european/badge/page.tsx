import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Breadcrumbs } from '@/components/Faq'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { CiteThis } from '@/components/really-european/CiteThis'
import { FEATURED_SLUGS, META, ROWS, VERDICT_LABEL, apaCitation, bibtexCitation } from '@/lib/really-european'
import { SITE_URL, pageMetadata } from '@/lib/site'
import { BadgePicker, type BadgeOption } from './BadgePicker'

export const metadata = pageMetadata({
  title: 'Really European? ownership badge',
  description:
    'Embed a dated ownership badge for any product or ICT provider in the Really European? dataset. It links back to the evidence and updates with corrections.',
  path: '/really-european/badge',
})

const OPTIONS: BadgeOption[] = [...ROWS]
  .sort((a, b) => a.product.localeCompare(b.product))
  .map((r) => ({
    slug: r.slug,
    product: r.list === 'dora-provider' ? `${r.product} (DORA provider)` : r.product,
    verdict: VERDICT_LABEL[r.verdict],
    checked_on: r.checked_on,
    page: FEATURED_SLUGS.has(r.slug),
  }))

export default function BadgePage() {
  return (
    <RootLayout>
      <Breadcrumbs
        trail={[
          { name: 'Home', path: '/' },
          { name: 'Really European?', path: '/really-european' },
          { name: 'Badge', path: '/really-european/badge' },
        ]}
      />
      <PageIntro eyebrow="Really European?" title="Ownership badge">
        <p>
          For directory maintainers and vendors: a small SVG that states our verdict for one row with the
          date we checked it, links to the row and the document behind it, and says
          &ldquo;unverified&rdquo; when that is the honest answer; it is served from here, so a correction
          changes every copy at once.
        </p>
      </PageIntro>
      <Container className="mt-10">
        <FadeIn>
          <BadgePicker options={OPTIONS} origin={SITE_URL} />
        </FadeIn>
      </Container>
      <Container className="mt-20">
        <FadeIn>
          <div className="rule-fade pt-10">
            <h2 className="font-display text-2xl font-medium text-white">Cite this dataset</h2>
            <p className="mt-4 max-w-3xl text-[var(--text-dim)]">
              Version {META.version}, public domain (CC0 1.0).
            </p>
            <div className="mt-8">
              <CiteThis apa={apaCitation()} bibtex={bibtexCitation()} />
            </div>
          </div>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
