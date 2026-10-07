import clsx from 'clsx'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export function PageIntro({
  eyebrow,
  title,
  children,
  centered = false,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  centered?: boolean
}) {
  return (
    <Container
      className={clsx('mt-24 sm:mt-32 lg:mt-40', centered && 'text-center')}
    >
      <FadeIn>
        {/* The template put the eyebrow inside the h1, so every page's heading
            read "Data cleaning - Bring the messy version" to a crawler. The
            eyebrow is a label; only the title is the heading. */}
        <p className="font-display text-base font-semibold text-white">{eyebrow}</p>
        <h1
          className={clsx(
            'mt-6 max-w-5xl font-display text-5xl font-medium tracking-tight text-balance text-white sm:text-6xl',
            centered && 'mx-auto',
          )}
        >
          {title}
        </h1>
        <div
          className={clsx(
            'mt-6 max-w-3xl text-xl text-[var(--text-dim)]',
            centered && 'mx-auto',
          )}
        >
          {children}
        </div>
      </FadeIn>
    </Container>
  )
}
