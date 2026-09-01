import { useState } from 'react'
import { Gallery } from '@/components/gallery/Gallery'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { listGallery } from '@/services/galleryService'
import type { GalleryCategory } from '@/types'
import { galleryLabels } from '@/utils/labels'
import { cn } from '@/utils/cn'

const filters: Array<GalleryCategory | 'todas'> = [
  'todas',
  'missas',
  'eventos',
  'festa-padroeira',
  'semana-santa',
  'catequese',
  'juventude',
  'pastorais',
  'acoes-sociais',
]

export function GalleryPage() {
  usePageMeta('Galeria | Paróquia Nossa Senhora das Graças')
  const [category, setCategory] = useState<GalleryCategory | 'todas'>('todas')
  const { data, loading, error } = useAsync(() => listGallery(category), [category])

  return (
    <div>
      <PageHeader
        eyebrow="Memória"
        title="Galeria"
        description="Imagens demonstrativas. A paróquia poderá publicar fotos reais pelo painel administrativo."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-8 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                category === item ? 'border-marian bg-marian text-white' : 'border-line bg-white',
              )}
            >
              {item === 'todas' ? 'Todas' : galleryLabels[item]}
            </button>
          ))}
        </div>
        {loading ? <Loading /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && data?.length === 0 ? <EmptyState title="Nenhuma foto nesta categoria" /> : null}
        {data ? <Gallery items={data} /> : null}
      </div>
    </div>
  )
}
