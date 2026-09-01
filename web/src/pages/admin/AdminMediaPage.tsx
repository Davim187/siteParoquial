import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { usePageMeta } from '@/hooks/usePageMeta'
import { deleteMedia, listMedia, uploadMedia, type MediaItem } from '@/services/mediaService'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Loading, EmptyState } from '@/components/ui/Feedback'
import { useAuth } from '@/contexts/AuthContext'

export function AdminMediaPage() {
  usePageMeta('Biblioteca de mídia | Admin')
  const toast = useToast()
  const { hasPermission } = useAuth()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState<MediaItem | null>(null)

  async function load() {
    setLoading(true)
    try {
      const result = await listMedia()
      setItems(result.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Imagens reutilizáveis em notícias, eventos e avisos.</p>
        {hasPermission('MEDIA_MANAGE') ? (
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-marian px-4 py-2 text-sm font-medium text-white hover:bg-marian-light">
            Enviar imagem
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  await uploadMedia(file)
                  toast.push('Imagem enviada com sucesso.')
                  await load()
                } catch (error) {
                  toast.push(error instanceof Error ? error.message : 'Falha no upload', 'error')
                }
              }}
            />
          </label>
        ) : null}
      </div>
      {loading ? <Loading /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title="Nenhuma imagem" description="Envie imagens para reutilizar em notícias, eventos e avisos." />
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <img
              src={item.thumbnailUrl || item.url}
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
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir imagem?"
        description={`Você está prestes a excluir "${toDelete?.originalName ?? ''}". Essa ação não poderá ser desfeita.`}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteMedia(toDelete.id)
          toast.push('Imagem excluída.')
          setToDelete(null)
          await load()
        }}
      />
    </div>
  )
}
