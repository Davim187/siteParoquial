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
import { useEventsQuery, useMassesQuery } from '@/hooks/queries/usePublicQueries'
import { deleteEvent, saveEvent } from '@/services/eventsService'
import { deleteMass, saveMass } from '@/services/massesService'
import type { EventCategory, Mass, ParishEvent } from '@/types'
import { formatDate } from '@/utils/dates'

export function AdminAgendaPage() {
  usePageMeta('Agenda | Admin')
  const { hasPermission } = useAuth()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useEventsQuery('todos')
  const [editing, setEditing] = useState<(Omit<ParishEvent, 'id'> & { id?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<ParishEvent | null>(null)

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    await saveEvent(editing)
    setEditing(null)
    invalidate.events()
  }

  return (
    <AdminCrudShell
      title="Agenda / Eventos"
      createLabel="+ Novo evento"
      createPermission="EVENTS_MANAGE"
      onCreate={() =>
        setEditing({
          title: '',
          date: new Date().toISOString().slice(0, 10),
          time: '19:00',
          location: 'Igreja Matriz',
          description: '',
          category: 'evento',
        })
      }
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Título', 'Data', 'Categoria', 'Ações']}
        rows={data?.map((item) => [
          item.title,
          `${formatDate(item.date)} ${item.time}`,
          item.category,
          <RowActions
            key={item.id}
            entityLabel="evento"
            canEdit={hasPermission('EVENTS_MANAGE')}
            canDelete={hasPermission('EVENTS_MANAGE')}
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Evento">
        {editing ? (
          <form onSubmit={onSave} className="grid gap-3">
            <AdminInput label="Título" value={editing.title} onChange={(title) => setEditing({ ...editing, title })} />
            <AdminInput label="Data" type="date" value={editing.date} onChange={(date) => setEditing({ ...editing, date })} />
            <AdminInput label="Horário" value={editing.time} onChange={(time) => setEditing({ ...editing, time })} />
            <AdminInput
              label="Local"
              value={editing.location}
              onChange={(location) => setEditing({ ...editing, location })}
            />
            <AdminTextarea
              label="Descrição"
              value={editing.description}
              onChange={(description) => setEditing({ ...editing, description })}
            />
            <label className="text-sm">
              Categoria
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as EventCategory })}
              >
                <option value="missa">Missa</option>
                <option value="adoracao">Adoração</option>
                <option value="confissao">Confissão</option>
                <option value="evento">Evento</option>
                <option value="reuniao">Reunião</option>
                <option value="pastoral">Pastoral</option>
                <option value="formacao">Formação</option>
                <option value="festa">Festa</option>
                <option value="celebracao-especial">Celebração especial</option>
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
        title="Excluir evento?"
        description={`Você está prestes a excluir "${toDelete?.title ?? ''}". Essa ação não poderá ser desfeita.`}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteEvent(toDelete.id)
          setToDelete(null)
          invalidate.events()
        }}
      />
    </AdminCrudShell>
  )
}

export function AdminMassesPage() {
  usePageMeta('Missas | Admin')
  const { hasPermission } = useAuth()
  const invalidate = useInvalidateQueries()
  const month = new Date().toISOString().slice(0, 7)
  const { data, isLoading, error } = useMassesQuery({ month, admin: true })
  const [editing, setEditing] = useState<(Omit<Mass, 'id'> & { id?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Mass | null>(null)

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    await saveMass({
      id: editing.id,
      date: editing.date,
      time: editing.time,
      type: editing.type,
      location: editing.location,
      notes: editing.notes,
    })
    setEditing(null)
    invalidate.masses()
  }

  return (
    <AdminCrudShell
      title={`Missas de ${month.split('-').reverse().join('/')}`}
      createLabel="+ Nova missa"
      createPermission="MASSES_MANAGE"
      onCreate={() =>
        setEditing({
          weekday: '',
          date: new Date().toISOString().slice(0, 10),
          time: '19:00',
          type: 'Santa Missa',
          location: 'Igreja Matriz',
          notes: '',
        })
      }
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Data', 'Horário', 'Tipo', 'Ações']}
        rows={data?.map((item) => [
          formatDate(item.date),
          item.time,
          item.type,
          <RowActions
            key={item.id}
            entityLabel="missa"
            canEdit={hasPermission('MASSES_MANAGE')}
            canDelete={hasPermission('MASSES_MANAGE')}
            onEdit={() => setEditing(item)}
            onDelete={() => setToDelete(item)}
          />,
        ])}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Missa">
        {editing ? (
          <form onSubmit={onSave} className="grid gap-3">
            <AdminInput label="Data" type="date" value={editing.date} onChange={(date) => setEditing({ ...editing, date })} />
            <AdminInput label="Horário" value={editing.time} onChange={(time) => setEditing({ ...editing, time })} />
            <AdminInput label="Tipo" value={editing.type} onChange={(type) => setEditing({ ...editing, type })} />
            <AdminInput
              label="Local"
              value={editing.location}
              onChange={(location) => setEditing({ ...editing, location })}
            />
            <AdminInput
              label="Observação"
              value={editing.notes ?? ''}
              onChange={(notes) => setEditing({ ...editing, notes })}
            />
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
        title="Excluir missa?"
        description={`Você está prestes a excluir o horário "${toDelete?.type ?? ''} · ${toDelete?.time ?? ''}". Essa ação não poderá ser desfeita.`}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteMass(toDelete.id)
          setToDelete(null)
          invalidate.masses()
        }}
      />
    </AdminCrudShell>
  )
}
