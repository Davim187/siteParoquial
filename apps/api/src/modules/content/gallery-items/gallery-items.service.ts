import type { GalleryCategory, Prisma } from '@prisma/client'
import { paginated, parsePagination } from '../../../lib/http.js'
import type { GalleryItemInput } from './gallery-items.schema.js'
import * as galleryItemsRepository from './gallery-items.repository.js'

export async function listGalleryItems(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query)
  const where: Prisma.GalleryItemWhereInput = { active: true }
  if (query.category) where.category = String(query.category) as GalleryCategory
  const [total, rows] = await Promise.all([
    galleryItemsRepository.countGalleryItems(where),
    galleryItemsRepository.findGalleryItems({ where, skip, take: limit }),
  ])
  return paginated(
    rows.map((item) => ({
      ...item,
      src: item.media.url,
      thumb: item.media.thumbnailUrl ?? item.media.url,
    })),
    total,
    page,
    limit,
  )
}

export async function createGalleryItem(data: GalleryItemInput) {
  return galleryItemsRepository.createGalleryItem({
    ...data,
    date: data.date ? new Date(data.date) : new Date(),
  })
}

export async function deleteGalleryItem(id: string) {
  await galleryItemsRepository.deleteGalleryItem(id)
  return { ok: true }
}
