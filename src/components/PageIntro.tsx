import clsx from 'clsx'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { HeroField } from '@/components/HeroField'

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
  // The solver from the home hero runs behind every page's opening. It is the
  // one moving thing on the site and the thing people remember; a page that
  // opens on a flat navy slab looked like a different site.
  return (
    <div className="relative isolate overflow-hidden">
      <HeroField className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_20%_50%,rgba(7,11,22,0.96),rgba(7,11,22,0.6)_60%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[var(--bg)]"
      />
    <Container
      className={clsx('relative pt-24 pb-12 sm:pt-32 sm:pb-16 lg:pt-40', centered && 'text-center')}
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
    </div>
  )
}
