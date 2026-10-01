import Link from 'next/link'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Logo } from '@/components/Logo'
import { socialMediaProfiles } from '@/components/SocialMedia'

const navigation = [
  {
    title: 'Company',
    links: [
      { title: 'Capabilities', href: '/services' },
      { title: 'Work', href: '/work' },
      { title: 'Quote Matcher', href: '/cm-optimiser' },
      { title: 'Data Clinic', href: '/data-clinic' },
      { title: 'Who owns what in food tech', href: '/exhibits/food-tech' },
      { title: 'Writing', href: '/insights' },
      { title: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Connect',
    links: socialMediaProfiles,
  },
]

function Navigation() {
  return (
    <nav>
      <ul role="list" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
        {navigation.map((section, sectionIndex) => (
          <li key={sectionIndex}>
            <div className="font-display text-sm font-semibold tracking-wider text-white">
              {section.title}
            </div>
            <ul role="list" className="mt-4 text-sm text-[var(--text-dim)]">
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex} className="mt-4">
                  <Link
                    href={link.href}
                    className="transition hover:text-white"
                    {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function ContactInfo() {
  return (
    <div className="max-w-sm">
      <h2 className="font-display text-sm font-semibold tracking-wider text-white">
        Get in Touch
      </h2>
      <p className="mt-4 text-sm text-[var(--text-dim)]">
        Have questions about data analytics or machine learning? 
        We&apos;re here to help transform your data into actionable insights.
      </p>
      <div className="mt-6 space-y-3 text-sm text-[var(--text-dim)]">
        <p>
          <strong className="text-white">Email:</strong><br />
          <a href="mailto:craakash@analytic-ascent.com" className="hover:text-white">
            craakash@analytic-ascent.com
          </a>
        </p>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <Container as="footer" className="mt-24 w-full sm:mt-32 lg:mt-40">
      <FadeIn>
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
          <Navigation />
          <div className="flex lg:justify-end">
            <ContactInfo />
          </div>
        </div>
        <div className="mt-24 mb-20 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-[var(--line-bright)]/10 pt-12">
          <Link href="/" aria-label="Home">
            <Logo className="h-8" fillOnHover />
          </Link>
          <p className="text-sm text-[var(--text-dim)]">
            © Analytics Ascent {new Date().getFullYear()}
          </p>
        </div>
      </FadeIn>
    </Container>
  )
}
