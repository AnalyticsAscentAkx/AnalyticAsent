import Link from 'next/link'
import clsx from 'clsx'

function XIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M13.3174 10.7749L19.1457 4H17.7646L12.7039 9.88256L8.66193 4H4L10.1122 12.8955L4 20H5.38119L10.7254 13.7878L14.994 20H19.656L13.3171 10.7749H13.3174ZM11.4257 12.9738L10.8064 12.0881L5.87886 5.03974H8.00029L11.9769 10.728L12.5765 11.6137L17.7652 19.0075H15.6438L11.4257 12.9742V12.9738Z" />
    </svg>
  )
}

function SubstackIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M3 3h18v2.5H3V3zm0 5.1h18V24l-9-5.1L3 24V8.1zm0 5.2h18v2.5H3v-2.5z" />
    </svg>
  )
}

export const socialMediaProfiles = [
  { title: 'Substack', href: 'https://craakash.substack.com/', icon: SubstackIcon },
  { title: 'X', href: 'https://x.com/analyticascent', icon: XIcon },
]

export function SocialMedia({
  className,
  invert = false,
}: {
  className?: string
  invert?: boolean
}) {
  return (
    <ul
      role="list"
      className={clsx(
        'flex gap-x-10',
        invert ? 'text-white' : 'text-white',
        className,
      )}
    >
      {socialMediaProfiles.map((socialMediaProfile) => (
        <li key={socialMediaProfile.title}>
          <Link
            href={socialMediaProfile.href}
            aria-label={socialMediaProfile.title}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'transition',
              invert ? 'hover:text-neutral-200' : 'hover:text-[var(--text-dim)]',
            )}
          >
            <socialMediaProfile.icon className="h-6 w-6 fill-current" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
