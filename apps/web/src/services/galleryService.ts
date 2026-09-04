import { apiRequest, mediaUrl } from '@/lib/api-client'
import { getErrorMessage } from '@/lib/api-error'
import { uploadMedia } from '@/services/mediaService'
import type { GalleryAlbum, GalleryPhoto, Paginated } from '@/types'

type ApiAlbum = {
  id: string
  title: string
  slug: string
  description?: string | null
  coverMediaId?: string | null
  coverUrl?: string | null
  coverThumbUrl?: string | null
  eventDate: string
  active: boolean
  sortOrder: number
  photoCount: number
  createdAt: string
  updatedAt: string
  photos?: ApiPhoto[]
}

type ApiPhoto = {
  id: string
  albumId: string
  mediaId: string
  title?: string | null
  description?: string | null
  sortOrder: number
  url: string
  thumbUrl: string
  originalName?: string
  createdAt: string
}

function mapPhoto(item: ApiPhoto): GalleryPhoto {
  return {
    id: item.id,
    albumId: item.albumId,
    mediaId: item.mediaId,
    title: item.title ?? undefined,
    description: item.description ?? undefined,
    sortOrder: item.sortOrder,
    url: mediaUrl(item.url),
    thumbUrl: mediaUrl(item.thumbUrl),
    originalName: item.originalName,
    createdAt: item.createdAt,
  }
}

function mapAlbum(item: ApiAlbum, photos?: GalleryPhoto[]): GalleryAlbum {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    description: item.description ?? undefined,
    coverMediaId: item.coverMediaId ?? undefined,
    coverUrl: mediaUrl(item.coverUrl),
    coverThumbUrl: mediaUrl(item.coverThumbUrl ?? item.coverUrl),
    eventDate: String(item.eventDate).slice(0, 10),
    active: item.active,
    sortOrder: item.sortOrder,
    photoCount: item.photoCount,
    createdAt: item.createdAt,
    photos,
  }
}

export async function listAlbums(params?: { all?: boolean; page?: number; limit?: number }) {
  const query = new URLSearchParams({ limit: String(params?.limit ?? 24), page: String(params?.page ?? 1) })
  if (params?.all) query.set('all', 'true')
  const result = await apiRequest<Paginated<ApiAlbum>>(`/api/gallery/albums?${query}`, { auth: params?.all ?? false })
  return { ...result, data: result.data.map((item) => mapAlbum(item)) }
}

export async function getAlbumBySlug(slug: string, params?: { all?: boolean }) {
  const query = params?.all ? '?all=true' : ''
  const item = await apiRequest<ApiAlbum>(`/api/gallery/albums/${encodeURIComponent(slug)}${query}`, {
    auth: params?.all ?? false,
  })
  return mapAlbum(item, item.photos?.map(mapPhoto))
}

export type AlbumInput = {
  title: string
  slug?: string
  description?: string
  coverMediaId?: string | null
  eventDate: string
  active: boolean
  sortOrder?: number
}

export async function createAlbum(input: AlbumInput) {
  const item = await apiRequest<ApiAlbum>('/api/gallery/albums', {
    method: 'POST',
    json: {
      ...input,
      eventDate: input.eventDate.includes('T') ? input.eventDate : `${input.eventDate}T12:00:00.000Z`,
    },
  })
  return mapAlbum(item)
}

export async function updateAlbum(id: string, input: Partial<AlbumInput>) {
  const payload = { ...input }
  if (payload.eventDate && !payload.eventDate.includes('T')) {
    payload.eventDate = `${payload.eventDate}T12:00:00.000Z`
  }
  const item = await apiRequest<ApiAlbum>(`/api/gallery/albums/${id}`, { method: 'PUT', json: payload })
  return mapAlbum(item)
}

export async function setAlbumPublished(id: string, active: boolean) {
  const item = await apiRequest<ApiAlbum>(`/api/gallery/albums/${id}/publish`, {
    method: 'PATCH',
    json: { active },
  })
  return mapAlbum(item)
}

export async function deleteAlbum(id: string) {
  await apiRequest(`/api/gallery/albums/${id}`, { method: 'DELETE' })
}

export type BulkUploadResult = {
  succeeded: Array<{ fileName: string; photoId: string }>
  failed: Array<{ fileName: string; error: string }>
  message: string
}

export async function addAlbumPhoto(albumId: string, mediaId: string) {
  const item = await apiRequest<ApiPhoto>(`/api/gallery/albums/${albumId}/photos`, {
    method: 'POST',
    json: { mediaId },
  })
  return mapPhoto(item)
}

export type BulkUploadFileEvent = {
  index: number
  fileName: string
  status: 'start' | 'success' | 'error'
  error?: string
}

export async function bulkUploadPhotos(
  albumId: string,
  files: File[],
  onProgress?: (done: number, total: number) => void,
  onFile?: (event: BulkUploadFileEvent) => void,
): Promise<BulkUploadResult> {
  const succeeded: BulkUploadResult['succeeded'] = []
  const failed: BulkUploadResult['failed'] = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    onFile?.({ index, fileName: file.name, status: 'start' })
    try {
      const media = await uploadMedia(file, 'gallery')
      const photo = await addAlbumPhoto(albumId, media.id)
      succeeded.push({ fileName: file.name, photoId: photo.id })
      onFile?.({ index, fileName: file.name, status: 'success' })
    } catch (error) {
      const message = getErrorMessage(error, 'Falha no upload.')
      failed.push({
        fileName: file.name,
        error: message,
      })
      onFile?.({ index, fileName: file.name, status: 'error', error: message })
    }
    onProgress?.(index + 1, files.length)
  }

  const message = [
    succeeded.length ? `${succeeded.length} foto(s) enviada(s) com sucesso.` : null,
    failed.length ? `${failed.length} foto(s) não puderam ser enviadas.` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    succeeded,
    failed,
    message: message || 'Nenhuma foto enviada.',
  }
}

export async function deleteAlbumPhoto(albumId: string, photoId: string) {
  await apiRequest(`/api/gallery/albums/${albumId}/photos/${photoId}`, { method: 'DELETE' })
}

/** @deprecated Galeria legada removida — use álbuns */
export async function listGallery() {
  return []
}

export async function deleteGalleryItem(id: string) {
  await apiRequest(`/api/gallery/${id}`, { method: 'DELETE' })
}

export async function saveGalleryItem(_input: unknown) {
  throw new Error('Use createAlbum e bulkUploadPhotos para a galeria por álbuns.')
}
