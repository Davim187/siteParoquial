import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface SectionTitleProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  light?: boolean
  children?: ReactNode
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'left',
  light = false,
  children,
}: SectionTitleProps) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? (
        <p
          className={cn(
            'mb-2 text-xs font-semibold uppercase tracking-[0.22em]',
            light ? 'text-gold' : 'text-gold-dark',
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className={cn('font-serif text-3xl font-semibold md:text-4xl', light ? 'text-white' : 'text-navy')}>
        {title}
      </h2>
      <div className={cn('mt-3 h-px w-16 bg-gold', align === 'center' && 'mx-auto')} />
      {description ? (
        <p className={cn('mt-4 text-base leading-relaxed', light ? 'text-white/80' : 'text-muted')}>
          {description}
        </p>
      ) : null}
      {children}
    </div>
  )
}
