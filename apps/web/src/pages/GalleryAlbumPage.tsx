import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import { PhotoGrid, PhotoLightbox } from '@/components/gallery/PhotoLightbox'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState, EmptyState } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useGalleryAlbumQuery } from '@/hooks/queries/useGalleryQueries'
import { getErrorMessage } from '@/lib/api-error'
import { formatLongDate } from '@/utils/dates'

export function GalleryAlbumPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data: album, isLoading, error } = useGalleryAlbumQuery(slug)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  usePageMeta(album ? `${album.title} | Galeria` : 'Álbum | Galeria')

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <Loading />
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <ErrorState message={getErrorMessage(error, 'Álbum não encontrado.')} />
        <Link to="/galeria" className="mt-4 inline-flex items-center gap-2 text-marian hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Voltar para a galeria
        </Link>
      </div>
    )
  }

  const photos = album.photos ?? []

  return (
    <div>
      <PageHeader
        eyebrow="Galeria"
        title={album.title}
        description={album.description ?? undefined}
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <Link to="/galeria" className="mb-6 inline-flex items-center gap-2 text-sm text-marian hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Todos os álbuns
        </Link>

        <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted">
          <span>{formatLongDate(album.eventDate)}</span>
          <span className="flex items-center gap-1.5 font-medium text-navy">
            <Camera className="h-4 w-4" />
            {album.photoCount} {album.photoCount === 1 ? 'foto' : 'fotos'}
          </span>
        </div>

        {photos.length === 0 ? (
          <EmptyState title="Este álbum ainda não possui fotos." />
        ) : (
          <PhotoGrid photos={photos} onPhotoClick={setLightboxIndex} />
        )}
      </div>

      {lightboxIndex !== null && photos.length > 0 ? (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </div>
  )
}
