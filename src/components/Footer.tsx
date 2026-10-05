import Link from 'next/link'

import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { Logo } from '@/components/Logo'
import { CONTACT_EMAIL } from '@/lib/site'
import { socialMediaProfiles } from '@/components/SocialMedia'

const navigation = [
  {
    title: 'Company',
    links: [
      { title: 'Capabilities', href: '/services' },
      { title: 'Work', href: '/work' },
      { title: 'Try it', href: '/tools' },
      { title: 'Writing', href: '/insights' },
      { title: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Products',
    links: [
      { title: 'parkingnetherlands.com', href: 'https://parkingnetherlands.com/' },
      { title: 'Quote Matcher', href: '/cm-optimiser' },
      { title: 'Data Clinic', href: '/data-clinic' },
      { title: 'Unit economics calculator', href: '/unit-economics' },
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
                    {...(link.href.startsWith('http')
                      ? {
                          target: '_blank',
                          rel: link.href.includes('parkingnetherlands') ? 'noopener' : 'noopener noreferrer',
                        }
                      : {})}
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
        Direct
      </h2>
      <p className="mt-4 text-sm text-[var(--text-dim)]">
        Read by the person who would do the work, not a queue. A reply within two working days,
        usually with a question before any proposal.
      </p>
      <div className="mt-6 space-y-3 text-sm text-[var(--text-dim)]">
        <p>
          <strong className="text-white">Email:</strong><br />
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
            {CONTACT_EMAIL}
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
