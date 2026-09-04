import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { usePageMeta } from '@/hooks/usePageMeta'
import { type MediaItem } from '@/services/mediaService'
import { useMediaLibrary } from '@/hooks/useMediaLibrary'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, SkeletonGrid } from '@/components/ui/Feedback'
import { useAuth } from '@/contexts/AuthContext'
import { mediaPreviewSrc } from '@/utils/media'

export function AdminMediaPage() {
  usePageMeta('Biblioteca de mídia | Admin')
  const toast = useToast()
  const { hasPermission } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [toDelete, setToDelete] = useState<MediaItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { items, loading, uploading, upload, remove } = useMediaLibrary()

  async function onUpload(file: File | null) {
    if (!file) return
    try {
      await upload(file)
      toast.push('Imagem enviada com sucesso.')
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Falha no upload', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Imagens reutilizáveis em notícias, eventos e avisos.</p>
        {hasPermission('MEDIA_MANAGE') ? (
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-marian px-4 py-2 text-sm font-medium text-white hover:bg-marian-light">
            {uploading ? 'Enviando...' : 'Enviar imagem'}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : null}
      </div>
      {loading ? <SkeletonGrid count={10} className="aspect-square h-auto" cols="grid-cols-2 md:grid-cols-4 lg:grid-cols-5" /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="Nenhuma imagem" description="Envie imagens para reutilizar em notícias, eventos e avisos." />
      ) : null}
      {!loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img
                src={mediaPreviewSrc(item)}
                alt={item.originalName}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="flex items-center justify-between gap-2 p-3">
                <p className="truncate text-xs text-slate-500">{item.originalName}</p>
                {hasPermission('MEDIA_MANAGE') ? (
                  <IconButton label="Excluir imagem" tone="danger" onClick={() => setToDelete(item)}>
                    <Trash2 size={15} />
                  </IconButton>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir imagem?"
        description={`Você está prestes a excluir "${toDelete?.originalName ?? ''}". Essa ação não poderá ser desfeita.`}
        loading={deleting}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          setDeleting(true)
          try {
            await remove(toDelete.id)
            setToDelete(null)
            toast.push('Imagem excluída.')
          } catch (error) {
            toast.push(error instanceof Error ? error.message : 'Falha ao excluir imagem', 'error')
            throw error
          } finally {
            setDeleting(false)
          }
        }}
      />
    </div>
  )
}
