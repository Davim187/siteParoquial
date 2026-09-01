import { cn } from '@/utils/cn'

const styles = {
  published: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  draft: 'bg-amber-50 text-amber-800 ring-amber-200',
  archived: 'bg-slate-100 text-slate-600 ring-slate-200',
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
  new: 'bg-amber-50 text-amber-800 ring-amber-200',
  read: 'bg-sky-50 text-sky-800 ring-sky-200',
  replied: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  prayed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
}

const defaultLabels: Record<keyof typeof styles, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  archived: 'Arquivado',
  active: 'Ativo',
  inactive: 'Inativo',
  info: 'Info',
  new: 'Nova',
  read: 'Lida',
  replied: 'Respondida',
  prayed: 'Atendido',
}

export function StatusBadge({
  status,
  label,
}: {
  status: keyof typeof styles
  label?: string
}) {
  const text = label ?? defaultLabels[status] ?? status

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  )
}
