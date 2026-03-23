import clsx from 'clsx'

function LogoIcon({ className, ...props }: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg 
      viewBox="0 0 120 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="0" y="16" width="48" height="24" fill="currentColor"/>
      <rect x="40" y="0" width="48" height="24" fill="currentColor"/>
    </svg>
  )
}

function LogomarkIcon({ className, ...props }: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="0" y="14" width="20" height="12" fill="currentColor"/>
      <rect x="12" y="6" width="20" height="12" fill="currentColor"/>
    </svg>
  )
}

export function Logomark({
  invert = false,
  filled = false,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  invert?: boolean
  filled?: boolean
}) {
  return (
    <div className={clsx('relative', className)} {...props}>
      <LogomarkIcon
        className={clsx(
          'h-8 w-auto transition-all duration-300',
          invert ? 'text-white' : 'text-neutral-950',
        )}
      />
    </div>
  )
}

export function Logo({
  className,
  invert = false,
  filled = false,
  fillOnHover = false,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  invert?: boolean
  filled?: boolean
  fillOnHover?: boolean
}) {
  return (
    <div
      className={clsx(fillOnHover && 'group/logo', className)}
      {...props}
    >
      <LogoIcon
        className={clsx(
          'h-8 w-auto transition-all duration-300',
          invert ? 'text-white' : 'text-neutral-950',
        )}
      />
    </div>
  )
}
