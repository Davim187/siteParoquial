import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  AdminCrudShell,
  AdminInput,
  AdminTable,
  RowActions,
} from '@/components/admin/AdminUi'
import { AdminDeleteConfirm } from '@/components/admin/AdminDeleteConfirm'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { LazyRichTextEditor } from '@/components/admin/LazyRichTextEditor'
import { useToast } from '@/components/ui/Toast'
import { uploadMedia } from '@/services/mediaService'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useInvalidateQueries } from '@/hooks/queries/useAdminQueries'
import { usePastoralsQuery } from '@/hooks/queries/usePublicQueries'
import { deletePastoral, savePastoral } from '@/services/pastoralService'
import type { Pastoral } from '@/types'

type PastoralForm = Omit<Pastoral, 'id' | 'slug'> & {
  id?: string
  slug?: string
  imageId?: string | null
}

export function AdminPastoralsPage() {
  usePageMeta('Pastorais | Admin')
  const toast = useToast()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = usePastoralsQuery({ includeInactive: true })
  const [editing, setEditing] = useState<PastoralForm | null>(null)
  const [toDelete, setToDelete] = useState<Pastoral | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  return (
    <AdminCrudShell
      title="Pastorais"
      onCreate={() =>
        setEditing({
          name: '',
          description: '<p></p>',
          image: '',
          imageId: null,
          responsible: '[RESPONSÁVEL]',
          contact: '[CONTATO]',
          meetingTime: '[HORÁRIO]',
          location: '[LOCAL]',
          active: true,
        })
      }
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Ativa', 'Ações']}
        rows={data?.map((item) => [
          item.name,
          item.active ? 'Sim' : 'Não',
          <RowActions
            key={item.id}
            entityLabel="pastoral"
            onEdit={() =>
              setEditing({
                ...item,
                imageId: (item as PastoralForm).imageId ?? null,
              })
            }
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
          await deletePastoral(toDelete.id)
          setToDelete(null)
          invalidate.pastorals()
        }}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Pastoral">
        {editing ? (
          <form
            className="grid gap-3"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              await savePastoral(editing)
              setEditing(null)
              invalidate.pastorals()
            }}
          >
            <AdminInput label="Nome" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Descrição</p>
              <p className="mb-2 text-xs text-slate-500">
                Use títulos, listas e negrito para organizar o texto da pastoral.
              </p>
              <LazyRichTextEditor
                value={editing.description}
                onChange={(description) => setEditing({ ...editing, description })}
                placeholder="Apresente a missão, as atividades e como participar..."
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Imagem</p>
              <div className="flex flex-wrap items-center gap-3">
                {editing.image ? (
                  <img src={editing.image} alt="" className="h-20 w-28 rounded-lg object-cover" />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                    {uploadingPhoto ? 'Enviando...' : 'Enviar arquivo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                      className="hidden"
                      disabled={uploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (!file) return
                        setUploadingPhoto(true)
                        try {
                          const media = await uploadMedia(file, 'pastorals')
                          setEditing((current) =>
                            current ? { ...current, image: media.url, imageId: media.id } : null,
                          )
                          toast.push('Imagem enviada com sucesso.')
                        } catch (uploadError) {
                          toast.push(
                            uploadError instanceof Error ? uploadError.message : 'Falha ao enviar imagem',
                            'error',
                          )
                        } finally {
                          setUploadingPhoto(false)
                        }
                      }}
                    />
                  </label>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                    Biblioteca de mídia
                  </Button>
                  {editing.image ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing({ ...editing, image: '', imageId: null })}
                    >
                      Remover
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
            <AdminInput
              label="Responsável"
              value={editing.responsible}
              onChange={(responsible) => setEditing({ ...editing, responsible })}
            />
            <AdminInput
              label="Contato"
              value={editing.contact}
              onChange={(contact) => setEditing({ ...editing, contact })}
            />
            <AdminInput
              label="Horário"
              value={editing.meetingTime}
              onChange={(meetingTime) => setEditing({ ...editing, meetingTime })}
            />
            <AdminInput
              label="Local"
              value={editing.location}
              onChange={(location) => setEditing({ ...editing, location })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              Ativa
            </label>
            <Button type="submit">Salvar</Button>
          </form>
        ) : null}
      </Modal>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          if (!editing) return
          setEditing({ ...editing, image: media.url, imageId: media.id })
          setPickerOpen(false)
        }}
      />
    </AdminCrudShell>
  )
}
