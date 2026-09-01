import { cn } from '@/utils/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'gold' | 'ghost' | 'outline' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-marian text-white hover:bg-marian-light active:bg-navy shadow-sm hover:shadow',
  secondary:
    'bg-white text-navy border border-line hover:border-marian/40 hover:bg-cream',
  gold: 'bg-gold text-navy-deep hover:bg-gold-dark hover:text-white',
  ghost: 'bg-transparent text-white hover:bg-white/10 border border-white/35',
  outline: 'border border-marian/70 text-marian hover:bg-marian hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  link: 'rounded-none bg-transparent px-0 text-marian hover:text-gold-dark underline-offset-4 hover:underline',
}

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  href?: string
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  loading = false,
  className,
  children,
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marian/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    variant !== 'link' ? sizes[size] : 'text-sm',
    className,
  )

  const content = (
    <>
      {loading ? <LoaderCircle size={16} className="animate-spin" /> : null}
      {children}
    </>
  )

  if (href) {
    const external = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
        >
          {content}
        </a>
      )
    }
    return (
      <Link to={href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
}
