import Link from 'next/link'
import clsx from 'clsx'

// Blue is the only chromatic colour on the site, so it is reserved for the one
// action that matters on a page. `invert` gives the quiet version for use on
// top of a blue or photographic panel, where a second blue would disappear.

type ButtonProps = {
  invert?: boolean
} & (
  | React.ComponentPropsWithoutRef<typeof Link>
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
)

export function Button({
  invert = false,
  className,
  children,
  ...props
}: ButtonProps) {
  className = clsx(
    className,
    'inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold transition duration-200',
    invert
      ? 'bg-white text-[#070b16] hover:bg-neutral-200'
      : 'bg-[var(--blue)] text-white shadow-[0_0_0_1px_rgb(59_130_246/0.4),0_8px_30px_-8px_var(--blue-glow)] hover:bg-[var(--blue-light)] hover:shadow-[0_0_0_1px_rgb(96_165_250/0.5),0_10px_36px_-8px_var(--blue-glow)]',
  )

  let inner = <span className="relative top-px">{children}</span>

  if (typeof props.href === 'undefined') {
    return (
      <button className={className} {...props}>
        {inner}
      </button>
    )
  }

  return (
    <Link className={className} {...props}>
      {inner}
    </Link>
  )
}
