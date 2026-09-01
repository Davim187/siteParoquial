import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  children?: ReactNode
}

export function PageHeader({ title, description, eyebrow, children }: PageHeaderProps) {
  return (
    <header className="border-b border-line bg-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        ) : null}
        <h1 className="font-serif text-4xl font-semibold md:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-white/80">{description}</p> : null}
        {children}
      </div>
    </header>
  )
}

export function Badge({
  children,
  tone = 'marian',
}: {
  children: ReactNode
  tone?: 'marian' | 'gold' | 'urgent' | 'muted'
}) {
  const tones = {
    marian: 'bg-marian/10 text-marian',
    gold: 'bg-gold/20 text-gold-dark',
    urgent: 'bg-red-100 text-red-800',
    muted: 'bg-beige text-muted',
  }
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide', tones[tone])}>
      {children}
    </span>
  )
}
