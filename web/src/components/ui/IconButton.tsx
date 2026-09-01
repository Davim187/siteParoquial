import { cn } from '@/utils/cn'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

type Tone = 'default' | 'primary' | 'danger' | 'dangerSolid' | 'success' | 'muted'

const tones: Record<Tone, string> = {
  default: 'text-slate-600 hover:bg-slate-100 hover:text-navy',
  primary: 'bg-marian text-white hover:bg-marian/90',
  danger: 'text-red-600 hover:bg-red-50',
  dangerSolid: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  muted: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
}

export function IconButton({
  label,
  tone = 'default',
  showTooltip = true,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  tone?: Tone
  showTooltip?: boolean
  children: ReactNode
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marian/40 disabled:opacity-40',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )

  if (!showTooltip) return button

  return (
    <Tooltip label={label} side="bottom">
      {button}
    </Tooltip>
  )
}
