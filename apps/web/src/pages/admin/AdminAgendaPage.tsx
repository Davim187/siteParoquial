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
import { MediaPicker } from '@/components/admin/MediaPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useAuth } from '@/contexts/AuthContext'
import { useInvalidateQueries } from '@/hooks/queries/useAdminQueries'
import { useEventsQuery, useMassesQuery } from '@/hooks/queries/usePublicQueries'
import { deleteEvent, saveEvent } from '@/services/eventsService'
import { deleteMass, saveMass } from '@/services/massesService'
import type { EventCategory, Mass, ParishEvent } from '@/types'
import { formatDate, toISODate } from '@/utils/dates'

export function AdminAgendaPage() {
  usePageMeta('Agenda | Admin')
  const { hasPermission } = useAuth()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = useEventsQuery('todos', { admin: true })
  const [editing, setEditing] = useState<(Omit<ParishEvent, 'id'> & { id?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<ParishEvent | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<'cover' | 'gallery'>('cover')

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
          slug: '',
          date: toISODate(new Date()),
          time: '19:00',
          location: 'Igreja Matriz',
          description: '',
          category: 'evento',
          image: undefined,
          imageId: null,
          gallery: [],
          galleryMediaIds: [],
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
            <AdminInput
              label="Horário"
              type="time"
              value={editing.time}
              onChange={(time) => setEditing({ ...editing, time })}
            />
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
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Imagem de capa</p>
              <div className="flex flex-wrap items-center gap-3">
                {editing.image ? <img src={editing.image} alt="" className="h-20 w-28 rounded-lg object-cover" /> : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPickerMode('cover')
                    setPickerOpen(true)
                  }}
                >
                  Escolher foto
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Galeria de fotos</p>
              <p className="mb-3 text-xs text-slate-500">As fotos aparecem na página do evento.</p>
              <div className="flex flex-wrap gap-2">
                {(editing.gallery ?? []).map((src, index) => (
                  <div key={`${src}-${index}`} className="relative">
                    <img src={src} alt="" className="h-20 w-24 rounded-lg object-cover" />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          gallery: (editing.gallery ?? []).filter((_, i) => i !== index),
                          galleryMediaIds: (editing.galleryMediaIds ?? []).filter((_, i) => i !== index),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPickerMode('gallery')
                    setPickerOpen(true)
                  }}
                >
                  + Adicionar foto
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        ) : null}
      </Modal>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          if (!editing) return
          if (pickerMode === 'gallery') {
            if ((editing.galleryMediaIds ?? []).includes(media.id)) {
              setPickerOpen(false)
              return
            }
            setEditing({
              ...editing,
              gallery: [...(editing.gallery ?? []), media.thumbnailUrl || media.url],
              galleryMediaIds: [...(editing.galleryMediaIds ?? []), media.id],
            })
          } else {
            setEditing({
              ...editing,
              image: media.thumbnailUrl || media.url,
              imageId: media.id,
            })
          }
          setPickerOpen(false)
        }}
      />
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
      celebrant: editing.celebrant,
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
          celebrant: '',
        })
      }
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Data', 'Horário', 'Tipo', 'Celebrante', 'Ações']}
        rows={data?.map((item) => [
          formatDate(item.date),
          item.time,
          item.type,
          item.celebrant || '—',
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
              label="Celebrante"
              value={editing.celebrant ?? ''}
              onChange={(celebrant) => setEditing({ ...editing, celebrant })}
              hint="Nome do padre ou diácono que preside. Pode deixar em branco."
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
