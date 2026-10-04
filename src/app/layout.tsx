import { type Metadata } from 'next'

import { Analytics } from '@/components/Analytics'
import { SiteStructuredData } from '@/components/StructuredData'
import { SITE_URL } from '@/lib/site'
import '@/styles/tailwind.css'

export const metadata: Metadata = {
  // Without this, Next.js cannot build absolute canonical or Open Graph URLs.
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s - Analytics Ascent',
    default: 'Analytics Ascent — analytics and optimisation for operations',
  },
  description: 'We help businesses leverage data analytics and machine learning to achieve impactful results through tailored solutions and expert guidance.',
  icons: {
    icon: '/favicon.svg',
  },
  alternates: { canonical: '/' },
  // Inherited by every route. Without these a shared link renders as a bare
  // URL in LinkedIn, Slack and WhatsApp, which is where this site is shared.
  openGraph: {
    type: 'website',
    siteName: 'Analytics Ascent',
    locale: 'en_GB',
    url: SITE_URL,
    title: 'Analytics Ascent — analytics and optimisation for operations',
    description:
      'Part matching, route optimisation, inventory planning, bidding and financial modelling. Four tools you can run in your browser, with the method published.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics Ascent — analytics and optimisation for operations',
    description:
      'Four tools you can run in your browser, and the measured numbers behind them.',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-[var(--bg-raised)] text-base antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        <SiteStructuredData />
        <Analytics />
      </body>
    </html>
  )
}
