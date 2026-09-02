import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination, slugify } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize } from '../../middlewares/authorize.js'
import { serializeMedia, toPublicMediaPath } from '../../lib/media-url.js'
import { createStorageService } from '../../storage/index.js'
import {
  createAlbumSchema,
  createPhotoSchema,
  MAX_BULK_UPLOAD_FILES,
  reorderPhotosSchema,
  updateAlbumSchema,
  updatePhotoSchema,
} from './gallery.schemas.js'

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
    const existing = await prisma.galleryAlbum.findUnique({ where: { slug: candidate } })
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

const albumInclude = {
  coverMedia: true,
  _count: { select: { photos: true } },
} satisfies Prisma.GalleryAlbumInclude

const photoInclude = {
  media: true,
} satisfies Prisma.GalleryPhotoInclude

export async function galleryRoutes(app: FastifyInstance) {
  app.get('/gallery/albums', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const { page, limit, skip } = parsePagination(query)
    const where: Prisma.GalleryAlbumWhereInput =
      query.all === 'true' ? {} : { active: true }

    const [total, rows] = await Promise.all([
      prisma.galleryAlbum.count({ where }),
      prisma.galleryAlbum.findMany({
        where,
        include: albumInclude,
        orderBy: [{ eventDate: 'desc' }, { sortOrder: 'asc' }],
        skip,
        take: limit,
      }),
    ])

    return reply.send(paginated(rows.map((row) => serializeAlbum(row)), total, page, limit))
  })

  app.get('/gallery/albums/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const query = request.query as Record<string, unknown>
    const adminView = query.all === 'true'

    const album = await prisma.galleryAlbum.findUnique({
      where: { slug },
      include: {
        coverMedia: true,
        photos: {
          include: photoInclude,
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!album || (!album.active && !adminView)) {
      throw new AppError(404, 'Álbum não encontrado.')
    }

    return reply.send(
      serializeAlbum(
        { ...album, _count: { photos: album.photos.length } },
        album.photos.map(serializePhoto),
      ),
    )
  })

  app.post('/gallery/albums', { preHandler: [authorize('GALLERY_MANAGE')] }, async (request, reply) => {
    const data = createAlbumSchema.parse(request.body)
    const slug = data.slug ? slugify(data.slug) : await uniqueAlbumSlug(data.title)

    const existing = await prisma.galleryAlbum.findUnique({ where: { slug } })
    if (existing) throw new AppError(409, 'Já existe um álbum com este identificador (slug).')

    const album = await prisma.galleryAlbum.create({
      data: {
        title: data.title,
        slug,
        description: data.description ?? null,
        coverMediaId: data.coverMediaId ?? null,
        eventDate: parseEventDate(data.eventDate),
        active: data.active,
        sortOrder: data.sortOrder,
      },
      include: albumInclude,
    })

    await logActivity({
      userId: request.authUser!.id,
      action: 'create',
      entity: 'gallery_album',
      entityId: album.id,
    })

    return reply.status(201).send(serializeAlbum(album))
  })

  app.put('/gallery/albums/:id', { preHandler: [authorize('GALLERY_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = updateAlbumSchema.parse(request.body)

    const current = await prisma.galleryAlbum.findUnique({ where: { id } })
    if (!current) throw new AppError(404, 'Álbum não encontrado.')

    let slug = data.slug ? slugify(data.slug) : undefined
    if (slug && slug !== current.slug) {
      const conflict = await prisma.galleryAlbum.findFirst({ where: { slug, NOT: { id } } })
      if (conflict) throw new AppError(409, 'Já existe um álbum com este identificador (slug).')
    } else if (data.title && !data.slug) {
      slug = await uniqueAlbumSlug(data.title, id)
    }

    const album = await prisma.galleryAlbum.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description === undefined ? undefined : data.description ?? null,
        coverMediaId: data.coverMediaId === undefined ? undefined : data.coverMediaId ?? null,
        eventDate: data.eventDate ? parseEventDate(data.eventDate) : undefined,
        active: data.active,
        sortOrder: data.sortOrder,
      },
      include: albumInclude,
    })

    await logActivity({
      userId: request.authUser!.id,
      action: 'update',
      entity: 'gallery_album',
      entityId: album.id,
    })

    return reply.send(serializeAlbum(album))
  })

  app.patch('/gallery/albums/:id/publish', { preHandler: [authorize('GALLERY_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { active } = (request.body as { active?: boolean }) ?? {}
    if (typeof active !== 'boolean') throw new AppError(400, 'Informe se o álbum está publicado ou em rascunho.')

    const album = await prisma.galleryAlbum.update({
      where: { id },
      data: { active },
      include: albumInclude,
    })

    return reply.send(serializeAlbum(album))
  })

  app.delete('/gallery/albums/:id', { preHandler: [authorize('GALLERY_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const album = await prisma.galleryAlbum.findUnique({ where: { id } })
    if (!album) throw new AppError(404, 'Álbum não encontrado.')

    await prisma.galleryAlbum.delete({ where: { id } })
    await logActivity({
      userId: request.authUser!.id,
      action: 'delete',
      entity: 'gallery_album',
      entityId: id,
    })

    return reply.send({ ok: true })
  })

  app.post('/gallery/albums/:id/photos', { preHandler: [authorize('GALLERY_MANAGE')] }, async (request, reply) => {
    const { id: albumId } = request.params as { id: string }
    const data = createPhotoSchema.parse(request.body)

    const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId } })
    if (!album) throw new AppError(404, 'Álbum não encontrado.')

    const media = await prisma.media.findUnique({ where: { id: data.mediaId } })
    if (!media) throw new AppError(404, 'Imagem não encontrada.')

    const maxOrder = await prisma.galleryPhoto.aggregate({
      where: { albumId },
      _max: { sortOrder: true },
    })
    const sortOrder = data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1

    const photo = await prisma.galleryPhoto.create({
      data: {
        albumId,
        mediaId: data.mediaId,
        title: data.title ?? null,
        description: data.description ?? null,
        sortOrder,
      },
      include: photoInclude,
    })

    const updates: Prisma.GalleryAlbumUpdateInput = {}
    if (!album.coverMediaId) updates.coverMedia = { connect: { id: data.mediaId } }
    if (Object.keys(updates).length) {
      await prisma.galleryAlbum.update({ where: { id: albumId }, data: updates })
    }

    return reply.status(201).send(serializePhoto(photo))
  })

  app.post(
    '/gallery/albums/:id/photos/bulk',
    { preHandler: [authorize('GALLERY_MANAGE')] },
    async (request, reply) => {
      const { id: albumId } = request.params as { id: string }
      const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId } })
      if (!album) throw new AppError(404, 'Álbum não encontrado.')

      const parts = request.files()
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

      const maxOrder = await prisma.galleryPhoto.aggregate({
        where: { albumId },
        _max: { sortOrder: true },
      })
      let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1

      const succeeded: Array<{ fileName: string; photoId: string }> = []
      const failed: Array<{ fileName: string; error: string }> = []

      for (const file of files) {
        try {
          const stored = await storage.upload(file.buffer, file.filename, file.mimetype, 'gallery')
          const media = await prisma.media.create({
            data: {
              originalName: file.filename,
              fileName: stored.fileName,
              url: stored.url,
              thumbnailUrl: stored.thumbnailUrl,
              mimeType: stored.mimeType,
              size: stored.size,
              width: stored.width,
              height: stored.height,
              folder: 'gallery',
              createdById: request.authUser!.id,
            },
          })

          const photo = await prisma.galleryPhoto.create({
            data: {
              albumId,
              mediaId: media.id,
              sortOrder: nextOrder++,
            },
            include: photoInclude,
          })

          if (!album.coverMediaId && succeeded.length === 0) {
            await prisma.galleryAlbum.update({
              where: { id: albumId },
              data: { coverMediaId: media.id },
            })
            album.coverMediaId = media.id
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
        userId: request.authUser!.id,
        action: 'bulk_upload',
        entity: 'gallery_album',
        entityId: albumId,
        metadata: { succeeded: succeeded.length, failed: failed.length },
      })

      return reply.status(failed.length === files.length ? 422 : 201).send({
        succeeded,
        failed,
        message:
          failed.length === 0
            ? `${succeeded.length} foto(s) enviada(s) com sucesso.`
            : `${succeeded.length} foto(s) enviada(s) com sucesso. ${failed.length} não puderam ser enviadas.`,
      })
    },
  )

  app.put(
    '/gallery/albums/:id/photos/reorder',
    { preHandler: [authorize('GALLERY_MANAGE')] },
    async (request, reply) => {
      const { id: albumId } = request.params as { id: string }
      const { photoIds } = reorderPhotosSchema.parse(request.body)

      const photos = await prisma.galleryPhoto.findMany({ where: { albumId } })
      if (photos.length !== photoIds.length) {
        throw new AppError(400, 'A lista de fotos não corresponde ao álbum.')
      }
      const ids = new Set(photos.map((p) => p.id))
      for (const photoId of photoIds) {
        if (!ids.has(photoId)) throw new AppError(400, 'Foto inválida para este álbum.')
      }

      await prisma.$transaction(
        photoIds.map((photoId, index) =>
          prisma.galleryPhoto.update({ where: { id: photoId }, data: { sortOrder: index } }),
        ),
      )

      return reply.send({ ok: true })
    },
  )

  app.patch(
    '/gallery/albums/:albumId/photos/:photoId',
    { preHandler: [authorize('GALLERY_MANAGE')] },
    async (request, reply) => {
      const { albumId, photoId } = request.params as { albumId: string; photoId: string }
      const data = updatePhotoSchema.parse(request.body)

      const photo = await prisma.galleryPhoto.findFirst({ where: { id: photoId, albumId } })
      if (!photo) throw new AppError(404, 'Foto não encontrada.')

      const updated = await prisma.galleryPhoto.update({
        where: { id: photoId },
        data: {
          title: data.title === undefined ? undefined : data.title ?? null,
          description: data.description === undefined ? undefined : data.description ?? null,
          sortOrder: data.sortOrder,
        },
        include: photoInclude,
      })

      return reply.send(serializePhoto(updated))
    },
  )

  app.delete(
    '/gallery/albums/:albumId/photos/:photoId',
    { preHandler: [authorize('GALLERY_MANAGE')] },
    async (request, reply) => {
      const { albumId, photoId } = request.params as { albumId: string; photoId: string }

      const photo = await prisma.galleryPhoto.findFirst({
        where: { id: photoId, albumId },
        include: { media: true, album: true },
      })
      if (!photo) throw new AppError(404, 'Foto não encontrada.')

      await prisma.galleryPhoto.delete({ where: { id: photoId } })

      if (photo.album.coverMediaId === photo.mediaId) {
        const next = await prisma.galleryPhoto.findFirst({
          where: { albumId },
          orderBy: { sortOrder: 'asc' },
          include: { media: true },
        })
        await prisma.galleryAlbum.update({
          where: { id: albumId },
          data: { coverMediaId: next?.mediaId ?? null },
        })
      }

      return reply.send({ ok: true })
    },
  )
}

export function formatZodError(error: ZodError) {
  const first = error.errors[0]
  return first?.message ?? 'Dados inválidos.'
}
