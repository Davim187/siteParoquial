import { useEffect, useState } from 'react'
import { Search, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { deleteMedia, listMedia, uploadMedia, type MediaItem } from '@/services/mediaService'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function MediaPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (media: MediaItem) => void
}) {
  const toast = useToast()
  const [items, setItems] = useState<MediaItem[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toDelete, setToDelete] = useState<MediaItem | null>(null)

  async function load() {
    setLoading(true)
    try {
      const result = await listMedia({ search })
      setItems(result.data)
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Erro ao carregar mídia', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void load()
  }, [open, search])

  async function onUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const media = await uploadMedia(file)
      toast.push('Imagem enviada com sucesso.')
      setSelected(media)
      await load()
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Falha no upload', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Biblioteca de mídia">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar imagens..."
              className="w-full rounded-xl border border-line bg-cream py-2 pr-3 pl-9 text-sm"
            />
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-marian px-4 py-2 text-sm font-medium text-white">
            <Upload size={16} />
            {uploading ? 'Enviando...' : 'Enviar imagem'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="hidden"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        {loading ? <p className="py-10 text-center text-sm text-muted">Carregando biblioteca...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Nenhuma imagem encontrada. Envie a primeira.</p>
        ) : null}
        <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              onDoubleClick={() => {
                onSelect(item)
                onClose()
              }}
              className={`overflow-hidden rounded-xl border text-left ${selected?.id === item.id ? 'border-marian ring-2 ring-marian/30' : 'border-line'}`}
            >
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.originalName}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <span className="block truncate px-2 py-1 text-xs text-muted">{item.originalName}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <Button
            variant="secondary"
            disabled={!selected}
            onClick={() => selected && setToDelete(selected)}
          >
            Excluir selecionada
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!selected}
              onClick={() => {
                if (!selected) return
                onSelect(selected)
                onClose()
              }}
            >
              Selecionar
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir imagem?"
        description="Essa ação não poderá ser desfeita. A imagem deixará de estar disponível na biblioteca."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          await deleteMedia(toDelete.id)
          toast.push('Imagem excluída.')
          setToDelete(null)
          setSelected(null)
          await load()
        }}
      />
    </>
  )
}
