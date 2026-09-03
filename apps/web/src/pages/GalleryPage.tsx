import { AlbumGrid } from '@/components/gallery/AlbumGrid'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState, EmptyState, SkeletonGrid } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useGalleryAlbumsQuery } from '@/hooks/queries/useGalleryQueries'
import { getErrorMessage } from '@/lib/api-error'

export function GalleryPage() {
  usePageMeta(
    'Galeria | Paróquia Nossa Senhora das Graças',
    'Álbuns de fotos dos eventos e momentos especiais da paróquia.',
  )
  const { data, isLoading, isFetching, error } = useGalleryAlbumsQuery({ limit: 24 })
  const albums = data?.data ?? []
  const showSkeleton = isLoading && !albums.length

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Memória"
        title="Galeria"
        description="Álbuns de fotos dos eventos e momentos especiais da paróquia."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {error && !albums.length ? <ErrorState message={getErrorMessage(error)} /> : null}
        {showSkeleton ? (
          <SkeletonGrid count={6} className="aspect-[4/3]" cols="sm:grid-cols-2 lg:grid-cols-3" />
        ) : null}
        {!showSkeleton && !error && albums.length === 0 ? (
          <EmptyState title="Nenhum álbum publicado ainda" />
        ) : null}
        {albums.length ? (
          <>
            {isFetching && !isLoading ? (
              <p className="mb-4 text-xs text-muted">Atualizando galeria...</p>
            ) : null}
            <AlbumGrid albums={albums} />
          </>
        ) : null}
      </div>
    </div>
  )
}
