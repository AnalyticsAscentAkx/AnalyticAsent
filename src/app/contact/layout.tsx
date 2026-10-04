import { type Metadata } from 'next'

// The contact page is a client component, and a client component cannot export
// metadata — which is why this page was silently inheriting the site-wide title
// and sharing it with the home page. A route layout is where its own metadata
// belongs.

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Start a conversation about part matching, route optimisation, inventory, bidding or financial modelling. Bring the messy extract.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact — bring the messy version',
    description:
      'Start a conversation about part matching, route optimisation, inventory, bidding or financial modelling.',
    url: '/contact',
    images: ['/opengraph-image'],
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
