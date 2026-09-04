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
import { MediaPicker } from '@/components/admin/MediaPicker'
import { useToast } from '@/components/ui/Toast'
import { uploadMedia } from '@/services/mediaService'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useInvalidateQueries } from '@/hooks/queries/useAdminQueries'
import { usePeopleQuery } from '@/hooks/queries/usePublicQueries'
import { deletePerson, savePerson } from '@/services/parishService'
import type { Person } from '@/types'

export function AdminPeoplePage() {
  usePageMeta('Pessoas | Admin')
  const toast = useToast()
  const invalidate = useInvalidateQueries()
  const { data, isLoading, error } = usePeopleQuery({ includeInactive: true })
  const [editing, setEditing] = useState<(Omit<Person, 'id' | 'slug'> & { id?: string; slug?: string }) | null>(null)
  const [toDelete, setToDelete] = useState<Person | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const usesPhotoUpload = editing?.type === 'padre' || editing?.type === 'diacono'

  return (
    <AdminCrudShell
      title="Pessoas"
      loading={isLoading && !data}
      error={error instanceof Error ? error.message : null}
    >
      <AdminTable
        headers={['Nome', 'Função', 'Ações']}
        rows={data?.map((item) => [
          item.name,
          item.role,
          <RowActions
            key={item.id}
            entityLabel="pessoa"
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
          await deletePerson(toDelete.id)
          setToDelete(null)
          invalidate.people()
        }}
      />
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Pessoa">
        {editing ? (
          <form
            className="grid gap-3"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault()
              await savePerson(editing)
              setEditing(null)
              invalidate.people()
            }}
          >
            <AdminInput label="Nome" value={editing.name} onChange={(name) => setEditing({ ...editing, name })} />
            <AdminInput label="Função" value={editing.role} onChange={(role) => setEditing({ ...editing, role })} />
            {usesPhotoUpload ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Foto</p>
                <div className="flex flex-wrap items-center gap-3">
                  {editing.photo ? (
                    <img
                      src={editing.photo}
                      alt=""
                      className="h-24 w-24 rounded-full border border-line object-cover"
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-cream">
                      {uploadingPhoto ? 'Enviando...' : 'Enviar arquivo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                        className="sr-only"
                        disabled={uploadingPhoto}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          if (!file) return
                          setUploadingPhoto(true)
                          try {
                            const media = await uploadMedia(file, 'people')
                            setEditing((current) =>
                              current ? { ...current, photo: media.url, photoId: media.id } : null,
                            )
                            toast.push('Foto enviada com sucesso.')
                          } catch (error) {
                            toast.push(
                              error instanceof Error ? error.message : 'Falha ao enviar foto',
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
                    {editing.photo ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditing({ ...editing, photo: '', photoId: null })}
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-muted">Envie JPG, PNG, WebP ou HEIC (iPhone) do computador (até 15 MB).</p>
              </div>
            ) : (
              <AdminInput label="Foto" value={editing.photo} onChange={(photo) => setEditing({ ...editing, photo })} />
            )}
            <AdminTextarea label="Biografia" value={editing.bio} onChange={(bio) => setEditing({ ...editing, bio })} />
            <AdminInput
              label="Frase"
              value={editing.quote ?? ''}
              onChange={(quote) => setEditing({ ...editing, quote })}
            />
            <AdminInput
              label="Atendimento"
              value={editing.attendance ?? ''}
              onChange={(attendance) => setEditing({ ...editing, attendance })}
            />
            <Button type="submit">Salvar</Button>
          </form>
        ) : null}
      </Modal>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          if (!editing) return
          setEditing({ ...editing, photo: media.url, photoId: media.id })
          setPickerOpen(false)
        }}
      />
    </AdminCrudShell>
  )
}
