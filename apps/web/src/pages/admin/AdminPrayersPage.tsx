import { useState } from 'react'
import {
  AdminCrudShell,
  AdminTable,
  RowActions,
} from '@/components/admin/AdminUi'
import { AdminDeleteConfirm } from '@/components/admin/AdminDeleteConfirm'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useInvalidateQueries, usePrayerRequestsQuery } from '@/hooks/queries/useAdminQueries'
import { deletePrayerRequest, updatePrayerStatus } from '@/services/prayerService'

export function AdminPrayersPage() {
  usePageMeta('Orações | Admin')
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = usePrayerRequestsQuery()
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null)

  return (
    <AdminCrudShell
      title="Pedidos de oração"
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Pedido', 'Status', 'Ações']}
        rows={data?.map((item) => [
          item.name,
          item.request,
          item.status,
          <RowActions
            key={item.id}
            entityLabel="pedido"
            onToggle={async () => {
              await updatePrayerStatus(item.id, item.status === 'new' ? 'prayed' : 'archived')
              invalidate.prayers()
              invalidate.dashboard()
            }}
            toggleLabel="Atualizar status"
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <AdminDeleteConfirm
        open={Boolean(toDelete)}
        label={toDelete?.name ?? ''}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deletePrayerRequest(toDelete.id)
          setToDelete(null)
          invalidate.prayers()
          invalidate.dashboard()
        }}
      />
    </AdminCrudShell>
  )
}
