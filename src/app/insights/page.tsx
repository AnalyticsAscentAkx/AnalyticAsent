import { type Metadata } from 'next'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'
import { LINKS, WRITING } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Writing',
  description:
    'Short pieces on Python tooling, applied statistics, where language models go wrong, and competition work. Two minutes each, published on Medium and Substack.',
}

export default function Insights() {
  const total = WRITING.reduce((n, s) => n + s.count, 0)

  return (
    <RootLayout>
      <PageIntro eyebrow="Writing" title="Two minutes, one idea">
        <p>
          Four series, {total} pieces, every one a two-minute read. If a topic
          needs longer than that, the scope gets cut rather than the word count
          padded. Published on Medium and cross-posted to Substack.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <div className="flex flex-wrap gap-4">
            <a
              href={LINKS.medium}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[var(--blue)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--blue-light)]"
            >
              Read on Medium
            </a>
            <a
              href={LINKS.substack}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[var(--line-bright)] px-5 py-2 text-sm font-semibold text-white transition hover:border-[var(--blue)] hover:text-[var(--blue-light)]"
            >
              Subscribe on Substack
            </a>
          </div>
        </FadeIn>
      </Container>

      <Container className="mt-16 sm:mt-20">
        <div className="space-y-12">
          {WRITING.map((s) => (
            <FadeIn key={s.title}>
              <section className="grid gap-8 border-t border-[var(--line)] pt-8 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <h2 className="font-display text-xl font-semibold text-white">
                    {s.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--text-faint)] tabular-nums">
                    {s.count} pieces
                  </p>
                </div>
                <div className="lg:col-span-8">
                  <p className="text-[var(--text-dim)]">{s.blurb}</p>
                  <ul className="mt-5 space-y-2">
                    {s.sample.map((t) => (
                      <li
                        key={t}
                        className="flex gap-3 text-sm text-[var(--text-dim)]"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 h-px w-4 shrink-0 bg-[var(--blue)]"
                        />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </FadeIn>
          ))}
        </div>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
