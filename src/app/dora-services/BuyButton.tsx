'use client'

import { Button } from '@/components/Button'
import { packageHref, type Package } from '@/lib/pricing'
import { track } from '@/lib/track'

// The one button on each package. With a Stripe Payment Link set it opens the
// hosted checkout; without one it goes to the contact form with the package
// named, so the page sells either way. The click is tracked so we know which
// package people reach for before any money moves.

export function BuyButton({ pkg }: { pkg: Package }) {
  const href = packageHref(pkg)
  const checkout = Boolean(pkg.stripe)
  return (
    <Button
      href={href}
      onClick={() => track('package_click', { package: pkg.id, checkout })}
      {...(checkout ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {checkout ? pkg.cta : `Request: ${pkg.name.toLowerCase()}`}
    </Button>
  )
}
