import { Link } from 'react-router-dom'
import { BRAND, logoSrcForTone, type LogoTone } from '@/config/brand'
import { cn } from '@/utils/cn'

type LogoProps = {
  compact?: boolean
  inverted?: boolean
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  tone?: LogoTone
  className?: string
}

const sizes = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11 sm:h-12 sm:w-12',
  lg: 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]',
}

export function Logo({
  compact = false,
  inverted = false,
  iconOnly = false,
  size = 'md',
  tone,
  className,
}: LogoProps) {
  const showText = !iconOnly
  const resolvedTone: LogoTone = tone ?? (inverted ? 'white' : 'black')

  return (
    <Link
      to="/"
      className={cn(
        'flex min-w-0 items-center gap-3',
        inverted ? 'text-white' : 'text-navy',
        className,
      )}
      aria-label={`${BRAND.name} — início`}
    >
      <BrandMark size={size} tone={resolvedTone} />
      {showText ? (
        <span className={compact ? 'hidden min-w-0 sm:block' : 'block min-w-0'}>
          <span className="block truncate font-serif text-base leading-tight font-semibold sm:text-lg md:text-xl">
            Paróquia Nossa Senhora
          </span>
          <span className="block text-[10px] tracking-[0.18em] text-gold-dark uppercase sm:text-xs">
            das Graças
          </span>
          {!compact ? (
            <span
              className={cn(
                'mt-0.5 block truncate text-[10px] tracking-wide uppercase',
                inverted ? 'text-white/60' : 'text-muted',
              )}
            >
              {BRAND.location}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  )
}

export function BrandMark({
  size = 'md',
  tone = 'black',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  tone?: LogoTone
  className?: string
}) {
  const px = size === 'lg' ? 72 : size === 'sm' ? 40 : 48

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', sizes[size], className)}
    >
      <img
        src={logoSrcForTone(tone)}
        alt={BRAND.logoAlt}
        className="h-full w-full object-contain"
        width={px}
        height={px}
        decoding="async"
      />
    </span>
  )
}
