import { AlbumGrid } from '@/components/gallery/AlbumGrid'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useGalleryAlbumsQuery } from '@/hooks/queries/useGalleryQueries'
import { getErrorMessage } from '@/lib/api-error'

export function GalleryPage() {
  usePageMeta('Galeria | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, isFetching, error } = useGalleryAlbumsQuery({ limit: 24 })
  const albums = data?.data ?? []

  return (
    <div>
      <PageHeader
        eyebrow="Memória"
        title="Galeria"
        description="Álbuns de fotos dos eventos e momentos especiais da paróquia."
      />
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {isLoading && !albums.length ? <Loading /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {!isLoading && !error && albums.length === 0 ? (
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
