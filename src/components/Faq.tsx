import { SITE_URL } from '@/lib/site'

// Questions people actually type, answered on the page and declared in markup.
//
// The keyword work turned up the same shape everywhere: not "break even
// calculator" alone but "break even analysis formula", "contribution margin
// meaning", "should cost model example". That is definition intent, it is what
// featured snippets are made of, and a page that answers it in the words the
// question was asked in is the one that gets quoted.
//
// The answers are written to stand alone, because a snippet is read without
// the page around it.

export interface QA {
  q: string
  a: string
}

export function Faq({ items, title = 'Questions people ask' }: { items: QA[]; title?: string }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: items.map((i) => ({
              '@type': 'Question',
              name: i.q,
              acceptedAnswer: { '@type': 'Answer', text: i.a },
            })),
          }),
        }}
      />
      <h2 className="font-display text-2xl font-medium text-white">{title}</h2>
      <dl className="mt-10 space-y-8">
        {items.map((i) => (
          <div key={i.q} className="border-t border-[var(--line)] pt-5">
            <dt className="font-display text-lg font-semibold text-white">{i.q}</dt>
            <dd className="mt-2 max-w-3xl leading-7 text-[var(--text-dim)]">{i.a}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}

/** Breadcrumbs, declared rather than drawn. Google shows the trail instead of a
 *  bare URL in results, which is a visible click-through difference for nested
 *  pages like the dataset. */
export function Breadcrumbs({ trail }: { trail: { name: string; path: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: t.name,
            item: `${SITE_URL}${t.path}`,
          })),
        }),
      }}
    />
  )
}
