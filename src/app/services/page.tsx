import { type Metadata } from 'next'
import Image from 'next/image'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { GridList, GridListItem } from '@/components/GridList'
import { PageIntro } from '@/components/PageIntro'
import { SectionIntro } from '@/components/SectionIntro'
import { RootLayout } from '@/components/RootLayout'
import imageBusinessIntelligence from '@/images/services/business-intelligence.jpg'
import imageDataEngineering from '@/images/services/data-engineering.jpg'

import type { StaticImageData } from 'next/image'

function ServiceCard({
  title,
  description,
  image,
}: {
  title: string
  description: string
  image?: StaticImageData
}) {
  return (
    <FadeIn className="flex">
      <article className="relative flex w-full flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 transition hover:bg-neutral-50 overflow-hidden">
        {image && (
          <div className="relative h-48 w-full mb-4 -m-6 mb-6">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        )}
        <h3 className="font-display text-xl font-semibold text-neutral-950">
          {title}
        </h3>
        <p className="mt-4 text-base text-neutral-600">{description}</p>
      </article>
    </FadeIn>
  )
}

function DetailedServices() {
  return (
    <div className="mt-24 rounded-4xl bg-neutral-950 py-24 sm:mt-32 lg:mt-40 lg:py-32">
      <SectionIntro
        eyebrow="What We Offer"
        title="Comprehensive Data Solutions"
        invert
      >
        <p>
          We provide a full range of services to help you harness the power of your data.
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <GridList>
          <GridListItem title="Data Engineering" invert>
            Building robust data pipelines using BigQuery, DBT, and modern data stack 
            technologies for seamless data integration and transformation.
          </GridListItem>
          <GridListItem title="Business Intelligence" invert>
            Creating insightful dashboards and reports that empower decision-making 
            and drive business growth through clear data visualization.
          </GridListItem>
          <GridListItem title="Machine Learning" invert>
            Developing and deploying custom machine learning models tailored to your 
            specific business needs and use cases.
          </GridListItem>
          <GridListItem title="Data Governance" invert>
            Implementing data quality frameworks and security practices to ensure 
            reliable, trustworthy data for all your decisions.
          </GridListItem>
          <GridListItem title="Optimization" invert>
            Applying advanced modeling and forecasting techniques to transform your 
            data into actionable business strategies.
          </GridListItem>
          <GridListItem title="Consulting" invert>
            Providing expert guidance on data strategy, architecture, and best 
            practices to help you achieve your analytics goals.
          </GridListItem>
        </GridList>
      </Container>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Analytics Ascent provides comprehensive data analytics and machine learning services to transform your business.',
}

export default function Services() {
  return (
    <RootLayout>
      <PageIntro eyebrow="Services" title="Our Services">
        <p>
          Transforming data into actionable insights for your business success.
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeInStagger className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ServiceCard
            title="Business Intelligence"
            description="Creating insightful dashboards that empower decision-making and drive business growth. We help you visualize your data in meaningful ways that reveal patterns and opportunities."
            image={imageBusinessIntelligence}
          />
          <ServiceCard
            title="Data Engineering"
            description="Building robust data pipelines using BigQuery and DBT for seamless data integration. We architect scalable solutions that grow with your business needs."
            image={imageDataEngineering}
          />
        </FadeInStagger>
      </Container>

      <DetailedServices />

      <ContactSection />
    </RootLayout>
  )
}
