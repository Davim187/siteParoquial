import { cn } from '@/utils/cn'
import { formatBRL, progressPercent } from '@/utils/html'

export function ProgressBar({
  current = 0,
  goal = 0,
  label,
  tone = 'light',
}: {
  current?: number
  goal?: number
  label?: string
  tone?: 'light' | 'dark'
}) {
  const percent = progressPercent(current, goal)
  const dark = tone === 'dark'

  return (
    <div className="space-y-2">
      {label ? (
        <p className={cn('text-sm font-semibold', dark ? 'text-gold' : 'text-navy')}>{label}</p>
      ) : null}
      <div className={cn('h-3 overflow-hidden rounded-full', dark ? 'bg-white/15' : 'bg-line')}>
        <div
          className={cn('h-full rounded-full', dark ? 'bg-gold' : 'bg-marian')}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className={cn('flex flex-wrap items-center justify-between gap-2 text-sm', dark ? 'text-white/80' : 'text-muted')}>
        <span>
          {formatBRL(current)} arrecadados
          {goal > 0 ? ` de ${formatBRL(goal)}` : ''}
        </span>
        <span className={cn('font-semibold', dark ? 'text-gold' : 'text-marian')}>{percent}%</span>
      </div>
    </div>
  )
}
