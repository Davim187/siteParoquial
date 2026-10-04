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
import { AdminDeleteConfirm } from '@/components/admin/AdminDeleteConfirm'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useInvalidateQueries } from '@/hooks/queries/useAdminQueries'
import { useSacramentsQuery } from '@/hooks/queries/usePublicQueries'
import { deleteSacrament, saveSacrament } from '@/services/sacramentService'
import type { Sacrament } from '@/types'

export function AdminSacramentsPage() {
  usePageMeta('Sacramentos | Admin')
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useSacramentsQuery()
  const [editing, setEditing] = useState<(Omit<Sacrament, 'id' | 'slug'> & { id?: string; slug?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Sacrament | null>(null)

  return (
    <AdminCrudShell
      title="Sacramentos"
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Ações']}
        rows={data?.map((item) => [
          item.name,
          <RowActions
            key={item.id}
            entityLabel="sacramento"
            onEdit={() => setEditing(item)}
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
          await deleteSacrament(toDelete.id)
          setToDelete(null)
          invalidate.sacraments()
        }}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Sacramento">
        {editing ? (
          <form
            className="grid gap-3"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              await saveSacrament(editing)
              setEditing(null)
              invalidate.sacraments()
            }}
          >
            <AdminInput label="Nome" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
            <AdminTextarea label="Resumo" value={editing.summary} onChange={(summary) => setEditing({ ...editing, summary })} />
            <AdminTextarea label="O que é" value={editing.whatItIs} onChange={(whatItIs) => setEditing({ ...editing, whatItIs })} />
            <AdminTextarea
              label="Quem pode receber"
              value={editing.whoCanReceive}
              onChange={(whoCanReceive) => setEditing({ ...editing, whoCanReceive })}
            />
            <AdminTextarea
              label="Como funciona"
              value={editing.howItWorks}
              onChange={(howItWorks) => setEditing({ ...editing, howItWorks })}
            />
            <AdminTextarea
              label="Documentos (um por linha)"
              value={editing.documents.join('\n')}
              onChange={(value) => setEditing({ ...editing, documents: value.split('\n').filter(Boolean) })}
            />
            <AdminTextarea
              label="Inscrição"
              value={editing.howToRegister}
              onChange={(howToRegister) => setEditing({ ...editing, howToRegister })}
            />
            <AdminInput
              label="Contato secretaria"
              value={editing.secretaryContact}
              onChange={(secretaryContact) => setEditing({ ...editing, secretaryContact })}
            />
            <Button type="submit">Salvar</Button>
          </form>
        ) : null}
      </Modal>
    </AdminCrudShell>
  )
}
