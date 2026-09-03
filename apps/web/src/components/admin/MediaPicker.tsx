import { useEffect, useState } from 'react'
import { Search, Upload } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { type MediaItem } from '@/services/mediaService'
import { useMediaLibrary } from '@/hooks/useMediaLibrary'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SkeletonGrid } from '@/components/ui/Feedback'
import { mediaPreviewSrc } from '@/utils/media'

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
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [toDelete, setToDelete] = useState<MediaItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('Enviando...')
  const { items, loading, uploading, load, upload, remove } = useMediaLibrary({ enabled: open, search })

  useEffect(() => {
    if (!open) {
      setSelected(null)
      setSearch('')
    }
  }, [open])

  async function onUpload(file: File | null, input?: HTMLInputElement | null) {
    if (!file) return
    const header = await file.slice(0, 12).arrayBuffer()
    const brand = String.fromCharCode(...new Uint8Array(header).slice(4, 12)).toLowerCase()
    const isHeic =
      /\.heic$/i.test(file.name) ||
      /\.heif$/i.test(file.name) ||
      /heic|heif|mif1|hevc/.test(brand)

    setUploadLabel(isHeic ? 'Convertendo HEIC...' : 'Enviando...')
    try {
      const media = await upload(file)
      setSelected(media)
      setSearch('')
      await load('')
      toast.push('Imagem enviada com sucesso.')
    } catch (error) {
      toast.push(error instanceof Error ? error.message : 'Falha no upload', 'error')
    } finally {
      if (input) input.value = ''
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
            {uploading ? uploadLabel : 'Enviar imagem'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="hidden"
              disabled={uploading}
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null, e.target)}
            />
          </label>
        </div>
        {loading ? (
          <SkeletonGrid count={8} className="aspect-square h-auto" cols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4" />
        ) : null}
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
                src={mediaPreviewSrc(item)}
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
            disabled={!selected || deleting}
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
        loading={deleting}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return
          setDeleting(true)
          try {
            await remove(toDelete.id)
            if (selected?.id === toDelete.id) setSelected(null)
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
    </>
  )
}
