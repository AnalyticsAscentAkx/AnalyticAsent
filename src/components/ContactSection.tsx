import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export function ContactSection() {
  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <FadeIn className="-mx-6 rounded-4xl bg-neutral-950 px-6 py-20 sm:mx-0 sm:py-32 md:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-medium text-balance text-white sm:text-4xl">
              Unlock Your Data Potential
            </h2>
            <p className="mt-4 text-lg text-neutral-300">
              Whether you&apos;re looking to build data pipelines, implement machine learning models, or transform your data into actionable insights, we&apos;re here to help.
            </p>
            <div className="mt-8 flex">
              <Button href="/contact" invert>
                Get in Touch
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>
    </Container>
  )
}
