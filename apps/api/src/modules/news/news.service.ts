import type { ContentStatus, Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination, slugify } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { toPublicMediaPath } from '../../lib/media-url.js'

const newsInput = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  subtitle: z.string().optional().nullable(),
  excerpt: z.string().min(3),
  content: z.string().min(3),
  coverMediaId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  publishedAt: z.string().datetime().optional().nullable(),
  galleryMediaIds: z.array(z.string()).optional(),
  showProgress: z.boolean().default(false),
  progressMode: z.enum(['amount', 'percent']).default('amount'),
  progressLabel: z.string().optional().nullable(),
  progressCurrent: z.coerce.number().min(0).optional(),
  progressGoal: z.coerce.number().min(0).optional(),
})

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

const include = {
  coverMedia: true,
  author: { select: { id: true, name: true, email: true } },
  category: true,
  galleryImages: { include: { media: true }, orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.NewsInclude

async function syncGallery(newsId: string, mediaIds?: string[]) {
  if (!mediaIds) return
  await prisma.newsImage.deleteMany({ where: { newsId } })
  if (mediaIds.length === 0) return
  await prisma.newsImage.createMany({
    data: mediaIds.map((mediaId, sortOrder) => ({ newsId, mediaId, sortOrder })),
  })
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

  const listInclude = opts?.publicOnly
    ? {
        coverMedia: true,
        author: { select: { id: true, name: true, email: true } },
        category: true,
      }
    : include

  const [total, rows] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({ where, include: listInclude, orderBy, skip, take: limit }),
  ])
  return paginated(rows.map(mapNews), total, page, limit)
}

export async function getCampaignNews() {
  const item = await prisma.news.findFirst({
    where: { showProgress: true, status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      excerpt: true,
      status: true,
      featured: true,
      showProgress: true,
      progressMode: true,
      progressLabel: true,
      progressCurrent: true,
      progressGoal: true,
      publishedAt: true,
      createdAt: true,
      coverMedia: true,
      category: true,
    },
  })
  if (!item) return null
  return mapNews({ ...item, content: '', galleryImages: [] })
}

export async function getNewsBySlug(slug: string, publicOnly = false) {
  const item = await prisma.news.findUnique({ where: { slug }, include })
  if (!item || (publicOnly && item.status !== 'PUBLISHED')) {
    throw new AppError(404, 'Notícia não encontrada.')
  }
  return mapNews(item)
}

export async function getNewsById(id: string) {
  const item = await prisma.news.findUnique({ where: { id }, include })
  if (!item) throw new AppError(404, 'Notícia não encontrada.')
  return mapNews(item)
}

async function ensureSingleFeatured(id: string) {
  await prisma.news.updateMany({
    where: { featured: true, id: { not: id } },
    data: { featured: false },
  })
}

export async function createNews(body: unknown, authorId: string) {
  const data = newsInput.parse(body)
  const slug = data.slug ? slugify(data.slug) : slugify(data.title)
  const exists = await prisma.news.findUnique({ where: { slug } })
  if (exists) throw new AppError(409, 'Já existe uma notícia com este endereço de página.')

  const progressCurrent =
    data.progressMode === 'percent'
      ? Math.min(100, Math.max(0, data.progressCurrent ?? 0))
      : (data.progressCurrent ?? 0)

  const item = await prisma.news.create({
    data: {
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
      progressMode: data.progressMode,
      progressLabel: data.progressLabel ?? null,
      progressCurrent,
      progressGoal: data.progressMode === 'percent' ? 100 : (data.progressGoal ?? 0),
      authorId,
      publishedAt:
        data.status === 'PUBLISHED'
          ? data.publishedAt
            ? new Date(data.publishedAt)
            : new Date()
          : null,
    },
    include,
  })
  await syncGallery(item.id, data.galleryMediaIds)
  if (item.featured) await ensureSingleFeatured(item.id)
  await logActivity({ userId: authorId, action: 'create', entity: 'news', entityId: item.id })
  return mapNews(await prisma.news.findUniqueOrThrow({ where: { id: item.id }, include }))
}

export async function updateNews(id: string, body: unknown, userId: string) {
  const data = newsInput.partial().parse(body)
  const current = await prisma.news.findUnique({ where: { id } })
  if (!current) throw new AppError(404, 'Notícia não encontrada.')
  const slug = data.slug ? slugify(data.slug) : data.title ? slugify(data.title) : current.slug
  if (slug !== current.slug) {
    const exists = await prisma.news.findUnique({ where: { slug } })
    if (exists) throw new AppError(409, 'Já existe uma notícia com este endereço de página.')
  }
  const { galleryMediaIds, publishedAt: publishedAtInput, ...newsData } = data
  const status = newsData.status ?? current.status
  const nextMode = newsData.progressMode ?? current.progressMode
  if (newsData.progressCurrent !== undefined && nextMode === 'percent') {
    newsData.progressCurrent = Math.min(100, Math.max(0, newsData.progressCurrent))
  }
  if (newsData.progressMode === 'percent') {
    newsData.progressGoal = 100
  }
  const item = await prisma.news.update({
    where: { id },
    data: {
      ...newsData,
      slug,
      publishedAt:
        status === 'PUBLISHED'
          ? publishedAtInput
            ? new Date(publishedAtInput)
            : current.publishedAt ?? new Date()
          : current.publishedAt,
    },
    include,
  })
  await syncGallery(id, galleryMediaIds)
  if (item.featured) await ensureSingleFeatured(item.id)
  await logActivity({ userId, action: 'update', entity: 'news', entityId: id })
  return mapNews(await prisma.news.findUniqueOrThrow({ where: { id }, include }))
}

export async function updateNewsStatus(id: string, body: unknown, userId: string) {
  const data = z.object({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']) }).parse(body)
  const item = await prisma.news.update({
    where: { id },
    data: {
      status: data.status,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined,
    },
    include,
  })
  await logActivity({ userId, action: `status:${data.status}`, entity: 'news', entityId: id })
  return mapNews(item)
}

export async function deleteNews(id: string, userId: string) {
  await prisma.news.delete({ where: { id } })
  await logActivity({ userId, action: 'delete', entity: 'news', entityId: id })
  return { ok: true }
}

export async function duplicateNews(id: string, userId: string) {
  const current = await prisma.news.findUnique({
    where: { id },
    select: {
      title: true,
      slug: true,
      subtitle: true,
      excerpt: true,
      content: true,
      coverMediaId: true,
      categoryId: true,
      showProgress: true,
      progressMode: true,
      progressLabel: true,
      progressCurrent: true,
      progressGoal: true,
      galleryImages: { select: { mediaId: true, sortOrder: true } },
    },
  })
  if (!current) throw new AppError(404, 'Notícia não encontrada.')

  const item = await prisma.news.create({
    data: {
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
      progressMode: current.progressMode,
      progressLabel: current.progressLabel,
      progressCurrent: current.progressCurrent,
      progressGoal: current.progressGoal,
      authorId: userId,
      publishedAt: null,
    },
    include,
  })
  await syncGallery(
    item.id,
    current.galleryImages
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((entry) => entry.mediaId),
  )
  void logActivity({ userId, action: 'duplicate', entity: 'news', entityId: item.id })
  return mapNews(await prisma.news.findUniqueOrThrow({ where: { id: item.id }, include }))
}

export async function listCategories() {
  return prisma.newsCategory.findMany({ orderBy: { name: 'asc' } })
}
