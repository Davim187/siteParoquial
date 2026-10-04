import type { Prisma } from '@prisma/client'
import { AppError, paginated, parsePagination } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { serializeMedia } from '../../lib/media-url.js'
import { createStorageService } from '../../storage/index.js'
import type { MediaUpdate } from './media.schema.js'
import * as mediaRepository from './media.repository.js'

const storage = createStorageService()

export async function listMedia(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query)
  const where: Prisma.MediaWhereInput = {}
  if (query.folder) where.folder = String(query.folder)
  if (query.search) {
    where.originalName = { contains: String(query.search), mode: 'insensitive' }
  }
  const [total, data] = await Promise.all([
    mediaRepository.countMedia(where),
    mediaRepository.findMedia({ where, skip, take: limit }),
  ])
  return paginated(data.map(serializeMedia), total, page, limit)
}

export async function uploadMedia(input: {
  buffer: Buffer
  filename: string
  mimetype: string
  folder: string
  userId: string
}) {
  try {
    const stored = await storage.upload(input.buffer, input.filename, input.mimetype, input.folder)
    const media = await mediaRepository.createMedia({
      originalName: input.filename,
      fileName: stored.fileName,
      url: stored.url,
      thumbnailUrl: stored.thumbnailUrl,
      mimeType: stored.mimeType,
      size: stored.size,
      width: stored.width,
      height: stored.height,
      folder: input.folder,
      createdById: input.userId,
    })
    await logActivity({
      userId: input.userId,
      action: 'upload',
      entity: 'media',
      entityId: media.id,
    })
    return serializeMedia(media)
  } catch (error) {
    throw new AppError(400, error instanceof Error ? error.message : 'Falha no upload.')
  }
}

export async function deleteMedia(id: string, userId: string) {
  const media = await mediaRepository.findMediaById(id)
  if (!media) throw new AppError(404, 'Mídia não encontrada.')
  await storage.delete(media.fileName)
  await mediaRepository.deleteMedia(id)
  await logActivity({ userId, action: 'delete', entity: 'media', entityId: id })
  return { ok: true }
}

export async function updateMedia(id: string, data: MediaUpdate) {
  const media = await mediaRepository.updateMedia(id, data)
  return serializeMedia(media)
}
