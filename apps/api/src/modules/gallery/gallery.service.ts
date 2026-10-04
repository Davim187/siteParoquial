import type { MultipartFile } from '@fastify/multipart'
import type { Prisma } from '@prisma/client'
import { AppError, paginated, parsePagination, slugify } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { serializeMedia, toPublicMediaPath } from '../../lib/media-url.js'
import { createStorageService } from '../../storage/index.js'
import type { AlbumInput, AlbumPublish, AlbumUpdate, PhotoInput, PhotoReorder, PhotoUpdate } from './gallery.schema.js'
import { MAX_BULK_UPLOAD_FILES } from './gallery.schema.js'
import * as galleryRepository from './gallery.repository.js'

const storage = createStorageService()

function parseEventDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00.000Z`)
    if (Number.isNaN(date.getTime())) throw new AppError(400, 'Informe uma data válida.')
    return date
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new AppError(400, 'Informe uma data válida.')
  return date
}

async function uniqueAlbumSlug(base: string, excludeId?: string) {
  let slug = slugify(base)
  if (!slug) slug = 'album'
  let suffix = 0
  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`
    const existing = await galleryRepository.findAlbumRecordBySlug(candidate)
    if (!existing || existing.id === excludeId) return candidate
    suffix++
  }
}

function serializePhoto(photo: {
  id: string
  albumId: string
  mediaId: string
  title: string | null
  description: string | null
  sortOrder: number
  createdAt: Date
  media: { url: string; thumbnailUrl: string | null; originalName: string }
}) {
  const media = serializeMedia(photo.media)
  return {
    id: photo.id,
    albumId: photo.albumId,
    mediaId: photo.mediaId,
    title: photo.title,
    description: photo.description,
    sortOrder: photo.sortOrder,
    createdAt: photo.createdAt,
    url: media.url,
    thumbUrl: media.thumbnailUrl ?? media.url,
    originalName: photo.media.originalName,
  }
}

function serializeAlbum(
  album: {
    id: string
    title: string
    slug: string
    description: string | null
    coverMediaId: string | null
    eventDate: Date
    active: boolean
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    coverMedia?: { url: string; thumbnailUrl: string | null } | null
    _count?: { photos: number }
  },
  photos?: ReturnType<typeof serializePhoto>[],
) {
  const coverUrl = toPublicMediaPath(album.coverMedia?.url ?? null)
  const coverThumbUrl = toPublicMediaPath(
    album.coverMedia?.thumbnailUrl ?? album.coverMedia?.url ?? null,
  )
  return {
    id: album.id,
    title: album.title,
    slug: album.slug,
    description: album.description,
    coverMediaId: album.coverMediaId,
    coverUrl,
    coverThumbUrl,
    eventDate: album.eventDate,
    active: album.active,
    sortOrder: album.sortOrder,
    photoCount: album._count?.photos ?? photos?.length ?? 0,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    photos,
  }
}

export async function listAlbums(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query)
  const where: Prisma.GalleryAlbumWhereInput = query.all === 'true' ? {} : { active: true }

  const [total, rows] = await Promise.all([
    galleryRepository.countAlbums(where),
    galleryRepository.findAlbums({ where, skip, take: limit }),
  ])

  return paginated(rows.map((row) => serializeAlbum(row)), total, page, limit)
}

export async function getAlbumBySlug(slug: string, adminView: boolean) {
  const album = await galleryRepository.findAlbumBySlug(slug)
  if (!album || (!album.active && !adminView)) {
    throw new AppError(404, 'Álbum não encontrado.')
  }

  return serializeAlbum(
    { ...album, _count: { photos: album.photos.length } },
    album.photos.map(serializePhoto),
  )
}

export async function createAlbum(data: AlbumInput, userId: string) {
  const slug = data.slug ? slugify(data.slug) : await uniqueAlbumSlug(data.title)

  const existing = await galleryRepository.findAlbumRecordBySlug(slug)
  if (existing) throw new AppError(409, 'Já existe um álbum com este identificador (slug).')

  const album = await galleryRepository.createAlbum({
    title: data.title,
    slug,
    description: data.description ?? null,
    coverMediaId: data.coverMediaId ?? null,
    eventDate: parseEventDate(data.eventDate),
    active: data.active,
    sortOrder: data.sortOrder,
  })

  await logActivity({
    userId,
    action: 'create',
    entity: 'gallery_album',
    entityId: album.id,
  })

  return serializeAlbum(album)
}

export async function updateAlbum(id: string, data: AlbumUpdate, userId: string) {
  const current = await galleryRepository.findAlbumById(id)
  if (!current) throw new AppError(404, 'Álbum não encontrado.')

  let slug = data.slug ? slugify(data.slug) : undefined
  if (slug && slug !== current.slug) {
    const conflict = await galleryRepository.findAlbumSlugConflict(slug, id)
    if (conflict) throw new AppError(409, 'Já existe um álbum com este identificador (slug).')
  } else if (data.title && !data.slug) {
    slug = await uniqueAlbumSlug(data.title, id)
  }

  const album = await galleryRepository.updateAlbum(id, {
    title: data.title,
    slug,
    description: data.description === undefined ? undefined : data.description ?? null,
    coverMediaId: data.coverMediaId === undefined ? undefined : data.coverMediaId ?? null,
    eventDate: data.eventDate ? parseEventDate(data.eventDate) : undefined,
    active: data.active,
    sortOrder: data.sortOrder,
  })

  await logActivity({
    userId,
    action: 'update',
    entity: 'gallery_album',
    entityId: album.id,
  })

  return serializeAlbum(album)
}

export async function publishAlbum(id: string, data: AlbumPublish) {
  const album = await galleryRepository.updateAlbum(id, { active: data.active })
  return serializeAlbum(album)
}

export async function deleteAlbum(id: string, userId: string) {
  const album = await galleryRepository.findAlbumById(id)
  if (!album) throw new AppError(404, 'Álbum não encontrado.')

  await galleryRepository.deleteAlbum(id)
  await logActivity({
    userId,
    action: 'delete',
    entity: 'gallery_album',
    entityId: id,
  })

  return { ok: true }
}

export async function addPhoto(albumId: string, data: PhotoInput) {
  const album = await galleryRepository.findAlbumById(albumId)
  if (!album) throw new AppError(404, 'Álbum não encontrado.')

  const media = await galleryRepository.findMediaById(data.mediaId)
  if (!media) throw new AppError(404, 'Imagem não encontrada.')

  const maxOrder = await galleryRepository.maxPhotoSortOrder(albumId)
  const sortOrder = data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1

  const photo = await galleryRepository.createPhoto({
    albumId,
    mediaId: data.mediaId,
    title: data.title ?? null,
    description: data.description ?? null,
    sortOrder,
  })

  if (!album.coverMediaId) {
    await galleryRepository.connectAlbumCover(albumId, data.mediaId)
  }

  return serializePhoto(photo)
}

export async function bulkUploadPhotos(albumId: string, parts: AsyncIterable<MultipartFile>, userId: string) {
  const album = await galleryRepository.findAlbumById(albumId)
  if (!album) throw new AppError(404, 'Álbum não encontrado.')

  const files: Array<{ filename: string; mimetype: string; buffer: Buffer }> = []

  for await (const part of parts) {
    if (part.type !== 'file') continue
    files.push({
      filename: part.filename,
      mimetype: part.mimetype,
      buffer: await part.toBuffer(),
    })
    if (files.length > MAX_BULK_UPLOAD_FILES) {
      throw new AppError(400, `É possível enviar no máximo ${MAX_BULK_UPLOAD_FILES} fotos por vez.`)
    }
  }

  if (files.length === 0) throw new AppError(400, 'Selecione pelo menos uma foto.')

  const maxOrder = await galleryRepository.maxPhotoSortOrder(albumId)
  let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

  const succeeded: Array<{ fileName: string; photoId: string }> = []
  const failed: Array<{ fileName: string; error: string }> = []
  let coverMediaId = album.coverMediaId

  for (const file of files) {
    try {
      const stored = await storage.upload(file.buffer, file.filename, file.mimetype, 'gallery')
      const media = await galleryRepository.createMedia({
        originalName: file.filename,
        fileName: stored.fileName,
        url: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
        mimeType: stored.mimeType,
        size: stored.size,
        width: stored.width,
        height: stored.height,
        folder: 'gallery',
        createdById: userId,
      })

      const photo = await galleryRepository.createPhoto({
        albumId,
        mediaId: media.id,
        sortOrder: nextOrder++,
      })

      if (!coverMediaId && succeeded.length === 0) {
        await galleryRepository.updateAlbumCover(albumId, media.id)
        coverMediaId = media.id
      }

      succeeded.push({ fileName: file.filename, photoId: photo.id })
    } catch (error) {
      failed.push({
        fileName: file.filename,
        error: error instanceof Error ? error.message : 'Falha no upload.',
      })
    }
  }

  await logActivity({
    userId,
    action: 'bulk_upload',
    entity: 'gallery_album',
    entityId: albumId,
    metadata: { succeeded: succeeded.length, failed: failed.length },
  })

  return {
    statusCode: failed.length === files.length ? 422 : 201,
    body: {
      succeeded,
      failed,
      message:
        failed.length === 0
          ? `${succeeded.length} foto(s) enviada(s) com sucesso.`
          : `${succeeded.length} foto(s) enviada(s) com sucesso. ${failed.length} não puderam ser enviadas.`,
    },
  }
}

export async function reorderPhotos(albumId: string, data: PhotoReorder) {
  const { photoIds } = data
  const photos = await galleryRepository.findPhotosByAlbum(albumId)
  if (photos.length !== photoIds.length) {
    throw new AppError(400, 'A lista de fotos não corresponde ao álbum.')
  }
  const ids = new Set(photos.map((photo) => photo.id))
  for (const photoId of photoIds) {
    if (!ids.has(photoId)) throw new AppError(400, 'Foto inválida para este álbum.')
  }

  await galleryRepository.reorderPhotos(photoIds)
  return { ok: true }
}

export async function updatePhoto(albumId: string, photoId: string, data: PhotoUpdate) {
  const photo = await galleryRepository.findPhoto(albumId, photoId)
  if (!photo) throw new AppError(404, 'Foto não encontrada.')

  const updated = await galleryRepository.updatePhoto(photoId, {
    title: data.title === undefined ? undefined : data.title ?? null,
    description: data.description === undefined ? undefined : data.description ?? null,
    sortOrder: data.sortOrder,
  })

  return serializePhoto(updated)
}

export async function deletePhoto(albumId: string, photoId: string) {
  const photo = await galleryRepository.findPhotoWithRelations(albumId, photoId)
  if (!photo) throw new AppError(404, 'Foto não encontrada.')

  await galleryRepository.deletePhoto(photoId)

  if (photo.album.coverMediaId === photo.mediaId) {
    const next = await galleryRepository.findNextCoverPhoto(albumId)
    await galleryRepository.clearOrSetCover(albumId, next?.mediaId ?? null)
  }

  return { ok: true }
}
