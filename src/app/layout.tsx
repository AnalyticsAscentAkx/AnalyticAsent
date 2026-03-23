import { type Metadata } from 'next'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
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
    <html lang="en" className="h-full bg-neutral-950 text-base antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
