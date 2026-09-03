import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { createStorageService } from '../../storage/index.js'
import { authorize, authorizeAny } from '../../middlewares/authorize.js'
import { serializeMedia } from '../../lib/media-url.js'
import { sanitizeUploadFolder } from '../../lib/upload-folders.js'

const storage = createStorageService()

export async function mediaRoutes(app: FastifyInstance) {
  app.get('/media', { preHandler: [authorize('MEDIA_MANAGE')] }, async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const { page, limit, skip } = parsePagination(query)
    const where: any = {}
    if (query.folder) where.folder = String(query.folder)
    if (query.search) {
      where.originalName = { contains: String(query.search), mode: 'insensitive' }
    }
    const [total, data] = await Promise.all([
      prisma.media.count({ where }),
      prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ])
    return reply.send(paginated(data.map(serializeMedia), total, page, limit))
  })

  app.post('/media/upload', { preHandler: [authorize('MEDIA_MANAGE')] }, async (request, reply) => {
    const file = await request.file()
    if (!file) throw new AppError(400, 'Nenhuma imagem enviada.')
    const buffer = await file.toBuffer()
    const rawFolder = (request.query as { folder?: string }).folder ?? 'general'
    const folder = sanitizeUploadFolder(rawFolder)
    try {
      const stored = await storage.upload(buffer, file.filename, file.mimetype, folder)
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
          folder,
          createdById: request.authUser!.id,
        },
      })
      await logActivity({
        userId: request.authUser!.id,
        action: 'upload',
        entity: 'media',
        entityId: media.id,
      })
      return reply.status(201).send(serializeMedia(media))
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Falha no upload.')
    }
  })

  app.delete('/media/:id', { preHandler: [authorize('MEDIA_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const media = await prisma.media.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            newsCovers: true,
            newsGallery: true,
            noticeImages: true,
            eventImages: true,
            pastoralImages: true,
            sacramentImages: true,
            personPhotos: true,
            galleryItems: true,
            galleryPhotos: true,
            albumCovers: true,
          },
        },
      },
    })
    if (!media) throw new AppError(404, 'Mídia não encontrada.')

    const refs = media._count
    const inUse =
      refs.newsCovers +
        refs.newsGallery +
        refs.noticeImages +
        refs.eventImages +
        refs.pastoralImages +
        refs.sacramentImages +
        refs.personPhotos +
        refs.galleryItems +
        refs.galleryPhotos +
        refs.albumCovers >
      0
    if (inUse) {
      throw new AppError(409, 'Esta mídia está em uso e não pode ser excluída.')
    }

    await storage.delete(media.fileName)
    await prisma.media.delete({ where: { id } })
    await logActivity({ userId: request.authUser!.id, action: 'delete', entity: 'media', entityId: id })
    return reply.send({ ok: true })
  })

  app.patch('/media/:id', { preHandler: [authorizeAny('MEDIA_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = z
      .object({ folder: z.string().optional(), originalName: z.string().optional() })
      .parse(request.body)
    const data = {
      ...body,
      ...(body.folder !== undefined ? { folder: sanitizeUploadFolder(body.folder) } : {}),
    }
    const media = await prisma.media.update({ where: { id }, data })
    return reply.send(serializeMedia(media))
  })
}
