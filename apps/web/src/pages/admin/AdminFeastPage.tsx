import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AdminInput, AdminTextarea } from '@/components/admin/AdminUi'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useInvalidateQueries, useFeastQuery } from '@/hooks/queries/useAdminQueries'
import { saveFeast } from '@/services/parishService'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'

export function AdminFeastPage() {
  usePageMeta('Festa | Admin')
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useFeastQuery()
  const [feast, setFeast] = useState(data)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) setFeast(data)
  }, [data])

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 max-w-2xl" />
      </div>
    )
  }
  if (error || !data) return <ErrorState message={error instanceof Error ? error.message : 'Erro'} />

  const current = feast ?? data

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">Festa da Padroeira</h1>
      <form
        className="mt-6 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          await saveFeast(current)
          invalidate.feast()
          setSaving(false)
        }}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={current.enabled}
            onChange={(e) => setFeast({ ...current, enabled: e.target.checked })}
          />
          Exibir banner especial na página inicial
        </label>
        <AdminInput
          label="Título"
          value={current.title}
          onChange={(title) => setFeast({ ...current, title })}
        />
        <AdminInput
          label="Data (rótulo)"
          value={current.dateLabel}
          onChange={(dateLabel) => setFeast({ ...current, dateLabel })}
        />
        <AdminTextarea
          label="Descrição"
          value={current.description}
          onChange={(description) => setFeast({ ...current, description })}
        />
        <p className="text-sm text-muted">
          A programação detalhada pode ser ampliada futuramente. Itens atuais: {current.program.length}.
        </p>
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  )
}
