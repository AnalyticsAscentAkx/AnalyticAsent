import { type Metadata } from 'next'
import Image from 'next/image'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { Testimonials } from '@/components/Testimonials'
import { RootLayout } from '@/components/RootLayout'

export const metadata: Metadata = {
  title: 'Client Analytics',
  description:
    'See how Analytics Ascent helps businesses transform their data into actionable insights and drive growth.',
}

export default function ClientAnalytics() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Client Analytics" title="Our Expertise in Action">
        <p>
          Specializing in data engineering, business intelligence, machine learning, 
          and optimization, we empower companies to transform their data into actionable insights.
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <div className="space-y-24 lg:space-y-32">
            <div>
              <h2 className="font-display text-2xl font-semibold text-neutral-950">
                Data-Driven Results
              </h2>
              <div className="mt-6 space-y-6 text-base text-neutral-600">
                <p>
                  Our clients span various industries, from retail and e-commerce to 
                  technology and finance. What they all share is a commitment to 
                  leveraging data for competitive advantage.
                </p>
                <p>
                  We work closely with each client to understand their unique challenges 
                  and develop customized solutions that deliver measurable results. Whether 
                  it&apos;s improving forecasting accuracy, optimizing operations, or uncovering 
                  new revenue opportunities, our data-driven approach consistently delivers value.
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-neutral-950">
                Our Approach
              </h2>
              <div className="mt-6 space-y-6 text-base text-neutral-600">
                <p>
                  We believe that effective data analytics starts with understanding 
                  your business goals. Our team takes the time to learn about your 
                  industry, challenges, and objectives before designing solutions.
                </p>
                <p>
                  This consultative approach ensures that every dashboard, model, and 
                  pipeline we build is aligned with your strategic priorities. We don&apos;t 
                  just deliver technology—we deliver business outcomes.
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-neutral-950">
                Industries We Serve
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: 'Technology', description: 'Helping tech companies scale their data infrastructure' },
                  { name: 'Retail', description: 'Optimizing inventory and customer analytics' },
                  { name: 'Finance', description: 'Risk modeling and financial forecasting' },
                  { name: 'Healthcare', description: 'Patient analytics and operational efficiency' },
                  { name: 'Manufacturing', description: 'Supply chain optimization and predictive maintenance' },
                  { name: 'E-commerce', description: 'Customer behavior analysis and personalization' },
                ].map((industry) => (
                  <div key={industry.name} className="rounded-2xl border border-neutral-200 p-6">
                    <h3 className="font-display text-lg font-semibold text-neutral-950">
                      {industry.name}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      {industry.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>

      <Testimonials />

      <ContactSection />
    </RootLayout>
  )
}
