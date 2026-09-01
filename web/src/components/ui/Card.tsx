import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  interactive?: boolean
}

export function Card({ children, className, interactive = true }: CardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-line/90 bg-white shadow-[0_1px_2px_rgba(26,54,93,0.04)]',
        interactive &&
          'transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(26,54,93,0.08)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
