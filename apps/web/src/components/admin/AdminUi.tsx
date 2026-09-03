import type { FormEvent, ReactNode } from 'react'
import { Eye, Copy, Pencil, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { ErrorState, SkeletonTable } from '@/components/ui/Feedback'
import { useAuth } from '@/contexts/AuthContext'

export function AdminCrudShell({
  title,
  onCreate,
  createLabel = 'Novo',
  createPermission,
  loading,
  error,
  skeletonCols = 4,
  children,
}: {
  title: string
  onCreate?: () => void
  createLabel?: string
  createPermission?: string
  loading?: boolean
  error?: string | null
  skeletonCols?: number
  children: ReactNode
}) {
  const { hasPermission } = useAuth()
  const canCreate = !createPermission || hasPermission(createPermission)

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{title}</p>
        {onCreate && canCreate ? (
          <Button onClick={onCreate} size="sm">
            {createLabel}
          </Button>
        ) : null}
      </div>
      {error ? <ErrorState message={error} /> : null}
      {loading ? <SkeletonTable cols={skeletonCols} /> : children}
    </div>
  )
}

export function AdminTable({
  headers,
  rows,
  emptyMessage = 'Nenhum registro encontrado.',
}: {
  headers: string[]
  rows?: Array<Array<ReactNode>>
  emptyMessage?: string
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-center text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-xs font-semibold tracking-wide uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows && rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={index} className="border-t border-slate-100 transition hover:bg-slate-50/80">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3.5 align-middle">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-4 py-10 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function RowActions({
  entityLabel = 'registro',
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  toggleLabel,
  canView,
  canEdit,
  canDuplicate,
  canDelete,
  canToggle,
  duplicating = false,
}: {
  entityLabel?: string
  onView?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onToggle?: () => void
  toggleLabel?: string
  canView?: boolean
  canEdit?: boolean
  canDuplicate?: boolean
  canDelete?: boolean
  canToggle?: boolean
  duplicating?: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {onView && canView !== false ? (
        <IconButton label={`Visualizar ${entityLabel}`} onClick={onView} showTooltip={false}>
          <Eye size={16} />
        </IconButton>
      ) : null}
      {onEdit && canEdit !== false ? (
        <IconButton label={`Editar ${entityLabel}`} onClick={onEdit} tone="primary" showTooltip={false}>
          <Pencil size={16} />
        </IconButton>
      ) : null}
      {onDuplicate && canDuplicate !== false ? (
        <IconButton
          label={duplicating ? 'Duplicando notícia...' : `Duplicar ${entityLabel}`}
          onClick={onDuplicate}
          loading={duplicating}
          showTooltip={false}
        >
          <Copy size={16} />
        </IconButton>
      ) : null}
      {onToggle && canToggle !== false ? (
        <IconButton label={toggleLabel ?? 'Alternar status'} onClick={onToggle} tone="success" showTooltip={false}>
          <Send size={16} />
        </IconButton>
      ) : null}
      {onDelete && canDelete !== false ? (
        <IconButton label={`Excluir ${entityLabel}`} onClick={onDelete} tone="dangerSolid" showTooltip={false}>
          <Trash2 size={16} />
        </IconButton>
      ) : null}
    </div>
  )
}

export function AdminInput({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  error,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  hint?: string
  error?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm transition outline-none focus:border-marian/40 focus:ring-2 focus:ring-marian/20"
      />
      {hint && !error ? <span className="mt-1.5 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1.5 block text-xs text-red-600">⚠ {error}</span> : null}
    </label>
  )
}

export function AdminTextarea({
  label,
  value,
  onChange,
  hint,
  error,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm transition outline-none focus:border-marian/40 focus:ring-2 focus:ring-marian/20"
      />
      {hint && !error ? <span className="mt-1.5 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1.5 block text-xs text-red-600">⚠ {error}</span> : null}
    </label>
  )
}

export function AdminSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  hint,
  error,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  hint?: string
  error?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm transition outline-none focus:border-marian/40 focus:ring-2 focus:ring-marian/20"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error ? <span className="mt-1.5 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1.5 block text-xs text-red-600">⚠ {error}</span> : null}
    </label>
  )
}

export function FormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-serif text-lg text-navy">{title}</h3>
      <div className="h-px bg-slate-100" />
      {children}
    </section>
  )
}

export type { FormEvent }
