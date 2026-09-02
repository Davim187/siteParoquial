import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { BulkPhotoUpload } from '@/components/admin/BulkPhotoUpload'
import {
  AdminCrudShell,
  AdminInput,
  AdminTable,
  AdminTextarea,
  RowActions,
} from '@/components/admin/AdminUi'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  useBulkUploadPhotosMutation,
  useCreateAlbumMutation,
  useDeleteAlbumMutation,
  useDeleteAlbumPhotoMutation,
  useGalleryAlbumQuery,
  useGalleryAlbumsQuery,
  usePublishAlbumMutation,
  useUpdateAlbumMutation,
} from '@/hooks/queries/useGalleryQueries'
import { getErrorMessage, getFieldErrors } from '@/lib/api-error'
import { formatDate } from '@/utils/dates'
import type { GalleryAlbum } from '@/types'
import { uploadMedia } from '@/services/mediaService'

const albumFormSchema = z.object({
  title: z.string().trim().min(2, 'O título do álbum é obrigatório.').max(150, 'O título deve ter no máximo 150 caracteres.'),
  description: z.string().trim().max(2000, 'A descrição deve ter no máximo 2000 caracteres.').optional(),
  eventDate: z.string().min(1, 'A data do evento é obrigatória.'),
  active: z.boolean(),
})

type AlbumForm = {
  id?: string
  title: string
  description: string
  eventDate: string
  active: boolean
  coverMediaId?: string | null
  coverUrl?: string
}

function emptyForm(): AlbumForm {
  return {
    title: '',
    description: '',
    eventDate: new Date().toISOString().slice(0, 10),
    active: false,
    coverMediaId: null,
    coverUrl: '',
  }
}

export function AdminGalleryPage() {
  usePageMeta('Galeria | Admin')
  const toast = useToast()
  const albumsQuery = useGalleryAlbumsQuery({ all: true, limit: 100 })
  const createMutation = useCreateAlbumMutation()
  const updateMutation = useUpdateAlbumMutation()
  const publishMutation = usePublishAlbumMutation()
  const deleteMutation = useDeleteAlbumMutation()

  const [editing, setEditing] = useState<AlbumForm | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadingCover, setUploadingCover] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [managing, setManaging] = useState<GalleryAlbum | null>(null)
  const [toDelete, setToDelete] = useState<GalleryAlbum | null>(null)

  async function saveAlbum(event: FormEvent) {
    event.preventDefault()
    if (!editing) return

    const parsed = albumFormSchema.safeParse({
      title: editing.title,
      description: editing.description,
      eventDate: editing.eventDate,
      active: editing.active,
    })

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setFormErrors(errors)
      return
    }

    setFormErrors({})

    try {
      if (editing.id) {
        await updateMutation.mutateAsync({
          id: editing.id,
          input: {
            title: editing.title,
            description: editing.description || undefined,
            eventDate: editing.eventDate,
            active: editing.active,
            coverMediaId: editing.coverMediaId ?? null,
          },
        })
        toast.push('Álbum atualizado com sucesso.')
      } else {
        const created = await createMutation.mutateAsync({
          title: editing.title,
          description: editing.description || undefined,
          eventDate: editing.eventDate,
          active: editing.active,
          coverMediaId: editing.coverMediaId ?? null,
        })
        toast.push('Álbum criado com sucesso.')
        setManaging(created)
      }
      setEditing(null)
    } catch (error) {
      setFormErrors(getFieldErrors(error))
      toast.push(getErrorMessage(error), 'error')
    }
  }

  return (
    <AdminCrudShell
      title="Álbuns da galeria"
      createLabel="Novo álbum"
      createPermission="GALLERY_MANAGE"
      onCreate={() => {
        setEditing(emptyForm())
        setFormErrors({})
      }}
      loading={albumsQuery.isLoading}
      error={albumsQuery.error ? getErrorMessage(albumsQuery.error) : null}
    >
      <AdminTable
        headers={['Título', 'Data', 'Fotos', 'Status', 'Ações']}
        rows={albumsQuery.data?.data.map((album) => [
          album.title,
          formatDate(album.eventDate),
          album.photoCount,
          <StatusBadge
            key={`${album.id}-status`}
            status={album.active ? 'published' : 'draft'}
            label={album.active ? 'Publicado' : 'Rascunho'}
          />,
          <RowActions
            key={album.id}
            entityLabel="álbum"
            onEdit={() => {
              setEditing({
                id: album.id,
                title: album.title,
                description: album.description ?? '',
                eventDate: album.eventDate,
                active: album.active,
                coverMediaId: album.coverMediaId ?? null,
                coverUrl: album.coverThumbUrl,
              })
              setFormErrors({})
            }}
            onView={() => setManaging(album)}
            toggleLabel={album.active ? 'Despublicar' : 'Publicar'}
            onToggle={async () => {
              try {
                await publishMutation.mutateAsync({ id: album.id, active: !album.active })
                toast.push(album.active ? 'Álbum despublicado.' : 'Álbum publicado.')
              } catch (error) {
                toast.push(getErrorMessage(error), 'error')
              }
            }}
            onDelete={() => setToDelete(album)}
          />,
        ])}
      />

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Editar álbum' : 'Novo álbum'}>
        {editing ? (
          <form className="grid gap-3" onSubmit={(event) => void saveAlbum(event)}>
            <AdminInput
              label="Título"
              required
              value={editing.title}
              error={formErrors.title}
              onChange={(title) => setEditing({ ...editing, title })}
            />
            <AdminTextarea
              label="Descrição"
              value={editing.description}
              onChange={(description) => setEditing({ ...editing, description })}
            />
            <AdminInput
              label="Data do evento"
              required
              type="date"
              value={editing.eventDate}
              error={formErrors.eventDate}
              onChange={(eventDate) => setEditing({ ...editing, eventDate })}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Capa do álbum</p>
              <div className="flex flex-wrap items-center gap-3">
                {editing.coverUrl ? (
                  <img src={editing.coverUrl} alt="" className="h-20 w-28 rounded-lg border object-cover" />
                ) : null}
                <label className="inline-flex cursor-pointer items-center rounded-full border border-line px-4 py-2 text-sm">
                  {uploadingCover ? 'Enviando...' : 'Enviar capa'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                    className="hidden"
                    disabled={uploadingCover}
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (!file) return
                      setUploadingCover(true)
                      try {
                        const media = await uploadMedia(file, 'gallery')
                        setEditing((current) =>
                          current
                            ? { ...current, coverMediaId: media.id, coverUrl: media.thumbnailUrl ?? media.url }
                            : null,
                        )
                      } catch (error) {
                        toast.push(getErrorMessage(error, 'Falha ao enviar capa.'), 'error')
                      } finally {
                        setUploadingCover(false)
                      }
                    }}
                  />
                </label>
                <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                  Biblioteca
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(event) => setEditing({ ...editing, active: event.target.checked })}
              />
              Publicado
            </label>

            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar álbum'}
            </Button>
          </form>
        ) : null}
      </Modal>

      <AlbumPhotosModal album={managing} onClose={() => setManaging(null)} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir álbum"
        description={`Deseja excluir o álbum "${toDelete?.title}"? As fotos também serão removidas.`}
        confirmLabel="Excluir"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await deleteMutation.mutateAsync(toDelete.id)
            toast.push('Álbum excluído.')
            setToDelete(null)
          } catch (error) {
            toast.push(getErrorMessage(error), 'error')
          }
        }}
      />

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => {
          setEditing((current) =>
            current ? { ...current, coverMediaId: media.id, coverUrl: media.thumbnailUrl ?? media.url } : null,
          )
          setPickerOpen(false)
        }}
      />
    </AdminCrudShell>
  )
}

function AlbumPhotosModal({ album, onClose }: { album: GalleryAlbum | null; onClose: () => void }) {
  const toast = useToast()
  const slug = album?.slug ?? ''
  const albumQuery = useGalleryAlbumQuery(slug, { all: true })
  const bulkMutation = useBulkUploadPhotosMutation()
  const deletePhotoMutation = useDeleteAlbumPhotoMutation()
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; name: string } | null>(null)

  const photos = albumQuery.data?.photos ?? []

  return (
    <>
      <Modal open={Boolean(album)} onClose={onClose} title={album ? `Fotos — ${album.title}` : 'Fotos'}>
        {album ? (
          <div className="space-y-4">
            <BulkPhotoUpload
              disabled={bulkMutation.isPending}
              onUpload={async (files) => {
                const result = await bulkMutation.mutateAsync({ albumId: album.id, files })
                if (result.failed.length) {
                  toast.push(result.message, result.succeeded.length ? 'success' : 'error')
                } else {
                  toast.push(result.message)
                }
                await albumQuery.refetch()
                return {
                  succeeded: result.succeeded.map((item) => item.fileName),
                  failed: result.failed,
                }
              }}
            />

            {albumQuery.isLoading ? <p className="text-sm text-muted">Carregando fotos...</p> : null}

            {photos.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((photo) => (
                  <li key={photo.id} className="relative overflow-hidden rounded-lg border">
                    <img src={photo.thumbUrl} alt="" className="aspect-square w-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded bg-white/90 px-2 py-0.5 text-xs text-red-600"
                      onClick={() =>
                        setPhotoToDelete({ id: photo.id, name: photo.title ?? photo.originalName ?? 'Foto' })
                      }
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nenhuma foto neste álbum ainda.</p>
            )}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(photoToDelete)}
        title="Remover foto"
        description={`Remover "${photoToDelete?.name}" deste álbum?`}
        confirmLabel="Remover"
        onClose={() => setPhotoToDelete(null)}
        onConfirm={async () => {
          if (!album || !photoToDelete) return
          try {
            await deletePhotoMutation.mutateAsync({ albumId: album.id, photoId: photoToDelete.id })
            toast.push('Foto removida.')
            setPhotoToDelete(null)
            await albumQuery.refetch()
          } catch (error) {
            toast.push(getErrorMessage(error), 'error')
          }
        }}
      />
    </>
  )
}
