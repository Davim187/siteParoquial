import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import type { GalleryAlbum } from '@/types'
import { formatDate } from '@/utils/dates'

export function AlbumGrid({ albums }: { albums: GalleryAlbum[] }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <li key={album.id}>
          <Link
            to={`/galeria/${album.slug}`}
            className="group block overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-cream-dark">
              {album.coverThumbUrl ? (
                <img
                  src={album.coverThumbUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted">
                  <Camera className="h-10 w-10 opacity-40" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-serif text-xl text-navy">{album.title}</h3>
              <p className="mt-1 text-sm text-muted">{formatDate(album.eventDate)}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-marian">
                <Camera className="h-4 w-4" />
                {album.photoCount} {album.photoCount === 1 ? 'foto' : 'fotos'}
              </p>
              {album.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted">{album.description}</p>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
