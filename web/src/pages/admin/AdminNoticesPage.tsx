import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  AdminCrudShell,
  AdminInput,
  AdminTable,
  AdminTextarea,
  RowActions,
} from '@/components/admin/AdminUi'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useAuth } from '@/contexts/AuthContext'
import { useInvalidateQueries } from '@/hooks/queries/useAdminQueries'
import { useNoticesQuery } from '@/hooks/queries/usePublicQueries'
import { deleteNotice, saveNotice } from '@/services/noticesService'
import type { ContentStatus, Notice, NoticeCategory } from '@/types'

const empty: Omit<Notice, 'id'> = {
  title: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  category: 'informativo',
  featured: false,
  status: 'published',
}

export function AdminNoticesPage() {
  usePageMeta('Avisos | Admin')
  const { hasPermission } = useAuth()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useNoticesQuery({ includeDrafts: true })
  const [editing, setEditing] = useState<(Omit<Notice, 'id'> & { id?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Notice | null>(null)

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    await saveNotice(editing)
    setEditing(null)
    invalidate.notices()
  }

  return (
    <AdminCrudShell
      title="Avisos paroquiais"
      createLabel="+ Novo aviso"
      createPermission="NOTICES_MANAGE"
      onCreate={() => setEditing({ ...empty })}
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Título', 'Categoria', 'Destaque', 'Ações']}
        rows={data?.map((item) => [
          item.title,
          item.category,
          item.featured ? 'Sim' : 'Não',
          <RowActions
            key={item.id}
            entityLabel="aviso"
            canEdit={hasPermission('NOTICES_MANAGE')}
            canDelete={hasPermission('NOTICES_MANAGE')}
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Aviso">
        {editing ? (
          <form onSubmit={onSave} className="grid gap-3">
            <AdminInput label="Título" value={editing.title} onChange={(title) => setEditing({ ...editing, title })} />
            <AdminTextarea
              label="Descrição"
              value={editing.description}
              onChange={(description) => setEditing({ ...editing, description })}
            />
            <AdminInput label="Data" type="date" value={editing.date} onChange={(date) => setEditing({ ...editing, date })} />
            <label className="text-sm">
              Categoria
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as NoticeCategory })}
              >
                <option value="informativo">Informativo</option>
                <option value="urgente">Urgente</option>
                <option value="liturgico">Litúrgico</option>
                <option value="evento">Evento</option>
                <option value="comunicado">Comunicado</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
              />
              Destaque na home
            </label>
            <label className="text-sm">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ContentStatus })}
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        ) : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir aviso?"
        description={`Você está prestes a excluir "${toDelete?.title ?? ''}". Essa ação não poderá ser desfeita.`}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteNotice(toDelete.id)
          setToDelete(null)
          invalidate.notices()
        }}
      />
    </AdminCrudShell>
  )
}
