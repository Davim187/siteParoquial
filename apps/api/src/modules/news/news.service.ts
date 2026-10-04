import type { ContentStatus, Prisma } from '@prisma/client'
import { AppError, paginated, parsePagination, slugify } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { toPublicMediaPath } from '../../lib/media-url.js'
import type { NewsInput, NewsStatusInput, NewsUpdate } from './news.schema.js'
import * as newsRepository from './news.repository.js'

function mapNews(item: any) {
  const gallery = (item.galleryImages ?? [])
    .slice()
    .sort((a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder)
  return {
    ...item,
    coverUrl: toPublicMediaPath(item.coverMedia?.url ?? null),
    coverThumbUrl: toPublicMediaPath(item.coverMedia?.thumbnailUrl ?? null),
    authorName: item.author?.name ?? null,
    categoryName: item.category?.name ?? null,
    gallery: gallery.map((entry: { media?: { url?: string | null } }) => toPublicMediaPath(entry.media?.url ?? null)).filter(Boolean),
    galleryMediaIds: gallery.map((entry: { mediaId: string }) => entry.mediaId),
  }
}

export async function listNews(query: Record<string, unknown>, opts?: { publicOnly?: boolean }) {
  const { page, limit, skip } = parsePagination(query)
  const where: Prisma.NewsWhereInput = {}
  if (opts?.publicOnly) where.status = 'PUBLISHED'
  if (query.status && !opts?.publicOnly) where.status = String(query.status) as ContentStatus
  if (query.categoryId) where.categoryId = String(query.categoryId)
  if (query.search) {
    const search = String(query.search)
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ]
  }
  const orderBy: Prisma.NewsOrderByWithRelationInput[] =
    String(query.sort) === 'title'
      ? [{ title: 'asc' }]
      : [{ showProgress: 'desc' }, { featured: 'desc' }, { publishedAt: 'desc' }]

  const [total, rows] = await Promise.all([
    newsRepository.countNews(where),
    newsRepository.findNews({ where, orderBy, skip, take: limit, publicOnly: opts?.publicOnly }),
  ])
  return paginated(rows.map(mapNews), total, page, limit)
}

export async function getCampaignNews() {
  const item = await newsRepository.findCampaignNews()
  if (!item) return null
  return mapNews({ ...item, content: '', galleryImages: [] })
}

export async function getNewsBySlug(slug: string, publicOnly = false) {
  const item = await newsRepository.findNewsBySlug(slug)
  if (!item || (publicOnly && item.status !== 'PUBLISHED')) {
    throw new AppError(404, 'Notícia não encontrada.')
  }
  return mapNews(item)
}

export async function getNewsById(id: string) {
  const item = await newsRepository.findNewsById(id)
  if (!item) throw new AppError(404, 'Notícia não encontrada.')
  return mapNews(item)
}

export async function createNews(data: NewsInput, authorId: string) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title)
  const exists = await newsRepository.findNewsIdBySlug(slug)
  if (exists) throw new AppError(409, 'Já existe uma notícia com este endereço de página.')

  const item = await newsRepository.createNews({
    title: data.title,
    slug,
    subtitle: data.subtitle ?? null,
    excerpt: data.excerpt,
    content: data.content,
    coverMediaId: data.coverMediaId ?? null,
    categoryId: data.categoryId ?? null,
    status: data.status,
    featured: data.featured,
    showProgress: data.showProgress,
    progressLabel: data.progressLabel ?? null,
    progressCurrent: data.progressCurrent ?? 0,
    progressGoal: data.progressGoal ?? 0,
    authorId,
    publishedAt:
      data.status === 'PUBLISHED'
        ? data.publishedAt
          ? new Date(data.publishedAt)
          : new Date()
        : null,
  })
  await newsRepository.replaceGallery(item.id, data.galleryMediaIds)
  if (item.featured) await newsRepository.clearOtherFeatured(item.id)
  await logActivity({ userId: authorId, action: 'create', entity: 'news', entityId: item.id })
  return mapNews(await newsRepository.findNewsByIdOrThrow(item.id))
}

export async function updateNews(id: string, data: NewsUpdate, userId: string) {
  const current = await newsRepository.findNewsRecordById(id)
  if (!current) throw new AppError(404, 'Notícia não encontrada.')
  const slug = data.slug ? slugify(data.slug) : data.title ? slugify(data.title) : current.slug
  if (slug !== current.slug) {
    const exists = await newsRepository.findNewsIdBySlug(slug)
    if (exists) throw new AppError(409, 'Já existe uma notícia com este endereço de página.')
  }
  const { galleryMediaIds, publishedAt: publishedAtInput, ...newsData } = data
  const status = newsData.status ?? current.status
  const item = await newsRepository.updateNews(id, {
    ...newsData,
    slug,
    publishedAt:
      status === 'PUBLISHED'
        ? publishedAtInput
          ? new Date(publishedAtInput)
          : current.publishedAt ?? new Date()
        : current.publishedAt,
  })
  await newsRepository.replaceGallery(id, galleryMediaIds)
  if (item.featured) await newsRepository.clearOtherFeatured(item.id)
  await logActivity({ userId, action: 'update', entity: 'news', entityId: id })
  return mapNews(await newsRepository.findNewsByIdOrThrow(id))
}

export async function updateNewsStatus(id: string, data: NewsStatusInput, userId: string) {
  const item = await newsRepository.updateNews(id, {
    status: data.status,
    publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined,
  })
  await logActivity({ userId, action: `status:${data.status}`, entity: 'news', entityId: id })
  return mapNews(item)
}

export async function deleteNews(id: string, userId: string) {
  await newsRepository.deleteNews(id)
  await logActivity({ userId, action: 'delete', entity: 'news', entityId: id })
  return { ok: true }
}

export async function duplicateNews(id: string, userId: string) {
  const current = await newsRepository.findNewsForDuplicate(id)
  if (!current) throw new AppError(404, 'Notícia não encontrada.')

  const item = await newsRepository.createNews({
    title: `${current.title} (cópia)`,
    slug: `${current.slug}-copia-${Date.now().toString(36)}`,
    subtitle: current.subtitle,
    excerpt: current.excerpt,
    content: current.content,
    coverMediaId: current.coverMediaId,
    categoryId: current.categoryId,
    status: 'DRAFT',
    featured: false,
    showProgress: current.showProgress,
    progressLabel: current.progressLabel,
    progressCurrent: current.progressCurrent,
    progressGoal: current.progressGoal,
    authorId: userId,
    publishedAt: null,
  })
  await newsRepository.replaceGallery(
    item.id,
    current.galleryImages
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((entry) => entry.mediaId),
  )
  void logActivity({ userId, action: 'duplicate', entity: 'news', entityId: item.id })
  return mapNews(await newsRepository.findNewsByIdOrThrow(item.id))
}

export async function listCategories() {
  return newsRepository.listCategories()
}
