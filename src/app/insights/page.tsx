import { type Metadata } from 'next'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { LINKS, PUBLICATION } from '@/lib/content'
import { ALL_ARTICLES, FEATURED, GROUPS, formatDate, type Article } from '@/lib/writing'

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Published pieces on route optimisation, open-data pipelines, working with language models, Python and SQL craft, and the ways numbers quietly mislead.',
}

export default function Insights() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Writing" title="Working notes, published">
        <p>
          {ALL_ARTICLES.length} published pieces, back to {PUBLICATION.since}. Most began as
          something that had to be worked out for a project and was written down so it would not
          have to be worked out twice. The recurring theme, if there is one: the arithmetic is
          rarely what goes wrong — the assumptions underneath it are.
        </p>
      </PageIntro>

      <Container className="mt-14">
        <FadeIn>
          <div className="flex flex-col gap-8 rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-raised)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="max-w-xl">
              <p className="font-display text-xl font-semibold text-white">
                {PUBLICATION.name}
              </p>
              <p className="mt-2 text-[var(--text-dim)]">{PUBLICATION.tagline}</p>
              <p className="mt-4 text-sm text-[var(--text-faint)] tabular-nums">
                {ALL_ARTICLES.length} pieces · published since {PUBLICATION.since}
              </p>
            </div>
            <a
              href={LINKS.substackSubscribe}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 self-start rounded-full bg-[var(--blue)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_var(--blue-glow)] transition hover:bg-[var(--blue-light)] sm:self-auto"
            >
              Subscribe
            </a>
          </div>
        </FadeIn>
      </Container>

      {/* ------------------------------------------------------- featured --- */}
      <Container className="mt-20 sm:mt-24">
        <FadeIn>
          <h2 className="border-b border-[var(--line)] pb-6 font-display text-2xl font-medium tracking-tight text-white">
            Start here
          </h2>
        </FadeIn>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {FEATURED.map((a) => (
            <FadeIn key={a.href}>
              <article className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-card)] p-7 transition hover:border-[var(--blue)]/50">
                <p className="text-xs text-[var(--text-faint)] tabular-nums">
                  {formatDate(a.date)}
                </p>
                <h3 className="mt-3 font-display text-lg leading-7 font-semibold text-white">
                  <a href={a.href} target="_blank" rel="noopener noreferrer">
                    {a.title}
                  </a>
                </h3>
                <p className="mt-4 flex-1 text-sm leading-6 text-[var(--text-dim)]">{a.hook}</p>
                {a.relatedTo && (
                  <p className="mt-5 border-t border-[var(--line)] pt-4 text-sm text-[var(--text-faint)]">
                    Written up from{' '}
                    <Link
                      href={a.relatedTo.href}
                      className="text-[var(--blue-light)] underline-offset-4 hover:underline"
                      {...(a.relatedTo.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {a.relatedTo.label}
                    </Link>
                  </p>
                )}
                <a
                  href={a.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 text-sm font-semibold text-white transition hover:text-[var(--blue-light)]"
                >
                  Read it
                </a>
              </article>
            </FadeIn>
          ))}
        </div>
      </Container>

      {/* --------------------------------------------------------- groups --- */}
      <Container className="mt-24 sm:mt-32">
        <div className="space-y-20">
          {GROUPS.map((g) => (
            <FadeIn key={g.slug}>
              <section className="grid gap-10 border-t border-[var(--line)] pt-10 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <h2 className="font-display text-xl font-semibold text-white">{g.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">{g.blurb}</p>
                  <p className="mt-4 text-sm text-[var(--text-faint)] tabular-nums">
                    {g.articles.length} pieces
                  </p>
                </div>
                <ul className="lg:col-span-8">
                  {g.articles.map((a) => (
                    <ArticleRow key={a.href} article={a} />
                  ))}
                </ul>
              </section>
            </FadeIn>
          ))}
        </div>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}

function ArticleRow({ article }: { article: Article }) {
  return (
    <li className="group border-b border-[var(--line)] py-5 first:pt-0">
      <a href={article.href} target="_blank" rel="noopener noreferrer" className="block">
        <div className="flex flex-wrap items-baseline gap-x-4">
          <h3 className="font-display font-semibold text-white transition group-hover:text-[var(--blue-light)]">
            {article.title}
          </h3>
          <span className="text-xs text-[var(--text-faint)] tabular-nums">
            {formatDate(article.date)}
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-dim)]">{article.hook}</p>
      </a>
    </li>
  )
}
