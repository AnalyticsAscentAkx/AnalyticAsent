import { type Metadata } from 'next'
import Image from 'next/image'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { SectionIntro } from '@/components/SectionIntro'
import { Testimonials } from '@/components/Testimonials'
import { RootLayout } from '@/components/RootLayout'
import imageBusinessIntelligence from '@/images/services/business-intelligence.jpg'
import imageDataEngineering from '@/images/services/data-engineering.jpg'
import imageLaptopDashboard from '@/images/analytics-ascent/laptop-dashboard.jpg'
import imageAnalyticsChart from '@/images/analytics-ascent/analytics-chart.jpg'
import imageMachineLearning from '@/images/analytics-ascent/machine-learning.jpg'

function Services() {
  const services = [
    {
      title: 'Data Engineering',
      description: 'Implement scalable data pipelines for your architecture using BigQuery, DBT, and modern data stack technologies.',
      image: imageDataEngineering,
    },
    {
      title: 'Custom Algorithm',
      description: 'Create tailored machine learning models for your specific business needs and use cases.',
      image: imageBusinessIntelligence,
    },
    {
      title: 'Governance & Trust',
      description: 'Embed data quality and security practices for reliable, trustworthy decision-making.',
    },
    {
      title: 'Optimization Solutions',
      description: 'Transform data into actionable strategies through advanced modeling and forecasting.',
    },
  ]

  return (
    <>
      <SectionIntro
        eyebrow="Services"
        title="Our Services"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Transforming data into actionable insights for your business success.
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <FadeInStagger className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {services.map((service) => (
            <FadeIn key={service.title} className="flex">
              <article className="relative flex w-full flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 transition hover:bg-neutral-50 overflow-hidden">
                {service.image && (
                  <div className="relative h-48 w-full mb-4 -m-6 mb-6">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="font-display text-xl font-semibold text-neutral-950">
                  {service.title}
                </h3>
                <p className="mt-4 text-base text-neutral-600">
                  {service.description}
                </p>
              </article>
            </FadeIn>
          ))}
        </FadeInStagger>
      </Container>
    </>
  )
}

function About() {
  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <FadeIn>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl">
              About Analytics Ascent
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              We help businesses leverage data analytics and machine learning to achieve impactful results through tailored solutions and expert guidance.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src={imageLaptopDashboard}
              alt="Analytics Dashboard"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </FadeIn>
    </Container>
  )
}

function Expertise() {
  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <FadeIn>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="lg:order-2">
            <h2 className="font-display text-3xl font-medium tracking-tight text-neutral-950 sm:text-4xl">
              Our Expertise
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Specializing in data engineering, business intelligence, machine learning, and optimization, we empower companies to transform their data into actionable insights.
            </p>
          </div>
          <div className="relative lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                <Image
                  src={imageAnalyticsChart}
                  alt="Analytics Chart"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mt-8">
                <Image
                  src={imageMachineLearning}
                  alt="Machine Learning"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </Container>
  )
}

export const metadata: Metadata = {
  title: 'Analytics Ascent - Data Analytics & Machine Learning Consulting',
  description:
    'We help businesses leverage data analytics and machine learning to achieve impactful results through tailored solutions and expert guidance.',
}

export default async function Home() {
  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32 md:mt-56">
        <FadeIn className="max-w-3xl">
          <h1 className="font-display text-5xl font-medium tracking-tight text-balance text-neutral-950 sm:text-7xl">
            Elevate Every Decision
          </h1>
          <p className="mt-6 text-xl text-neutral-600">
            We help businesses leverage data analytics and machine learning to achieve impactful results through tailored solutions and expert guidance.
          </p>
        </FadeIn>
      </Container>

      <About />

      <Expertise />

      <Services />

      <Testimonials />

      <ContactSection />
    </RootLayout>
  )
}
