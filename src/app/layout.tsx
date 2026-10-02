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
    default: 'Analytics Ascent - Data Analytics & Machine Learning Consulting',
  },
  description: 'We help businesses leverage data analytics and machine learning to achieve impactful results through tailored solutions and expert guidance.',
  icons: {
    icon: '/favicon.svg',
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
