import { type Metadata } from 'next'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { RootLayout } from '@/components/RootLayout'

const insights = [
  {
    title: 'The Future of Data Engineering',
    description: 'Exploring trends in modern data stack technologies and how they\'re reshaping how businesses handle data.',
    category: 'Data Engineering',
    comingSoon: true,
  },
  {
    title: 'Machine Learning in Practice',
    description: 'Real-world applications of ML models and lessons learned from production deployments.',
    category: 'Machine Learning',
    comingSoon: true,
  },
  {
    title: 'Building a Data-Driven Culture',
    description: 'How to foster data literacy and decision-making across your organization.',
    category: 'Strategy',
    comingSoon: true,
  },
]

export const metadata: Metadata = {
  title: 'Insights & Publications',
  description:
    'Stay updated on data analytics insights, machine learning trends, and best practices from Analytics Ascent.',
}

export default function Insights() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Insights" title="Insights & Publications">
        <p>
          Stay updated on data analytics insights and trends. We share our expertise 
          and learnings to help you stay ahead in the data-driven world.
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <div className="rounded-3xl bg-neutral-50 p-8 sm:p-12 text-center">
            <h2 className="font-display text-2xl font-semibold text-neutral-950">
              Coming Soon
            </h2>
            <p className="mt-4 text-base text-neutral-600 max-w-2xl mx-auto">
              We&apos;re working on a collection of articles, case studies, and insights 
              about data analytics, machine learning, and business intelligence. 
              Check back soon for our latest publications.
            </p>
          </div>
        </FadeIn>

        <FadeInStagger className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {insights.map((insight) => (
            <FadeIn key={insight.title}>
              <article className="relative flex flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 h-full">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 w-fit">
                  {insight.category}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-neutral-950">
                  {insight.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-600 flex-1">
                  {insight.description}
                </p>
                {insight.comingSoon && (
                  <span className="mt-4 text-xs font-medium text-neutral-400">
                    Coming Soon
                  </span>
                )}
              </article>
            </FadeIn>
          ))}
        </FadeInStagger>
      </Container>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <div className="rounded-4xl bg-neutral-950 py-16 px-6 sm:px-12 text-center">
            <h2 className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Want to Stay Updated?
            </h2>
            <p className="mt-4 text-base text-neutral-300 max-w-xl mx-auto">
              Get notified when we publish new insights and articles about data 
              analytics and machine learning.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 font-semibold text-white hover:text-neutral-200 transition-colors"
              >
                Get in touch to subscribe
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </FadeIn>
      </Container>

      <ContactSection />
    </RootLayout>
  )
}
