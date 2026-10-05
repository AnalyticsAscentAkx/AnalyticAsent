import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export function ContactSection() {
  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <FadeIn className="-mx-6 rounded-4xl bg-[var(--bg-raised)] px-6 py-20 sm:mx-0 sm:py-32 md:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-medium text-balance text-white sm:text-4xl">
              Try it on your own file first
            </h2>
            <p className="mt-4 text-lg text-[var(--text-dim)]">
              Every tool here runs in your browser and uploads nothing, so you can see what we
              would see before telling us anything at all. When it is worth a conversation, send
              the real extract and the question you actually need answered.
            </p>
            <div className="mt-8 flex">
              <Button href="/contact" invert>
                Start a conversation
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>
    </Container>
  )
}
