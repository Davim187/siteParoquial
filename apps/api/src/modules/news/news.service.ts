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
})

function mapNews(item: any) {
  return {
    ...item,
    coverUrl: toPublicMediaPath(item.coverMedia?.url ?? null),
    coverThumbUrl: toPublicMediaPath(item.coverMedia?.thumbnailUrl ?? null),
    authorName: item.author?.name ?? null,
    categoryName: item.category?.name ?? null,
  }
}

const include = {
  coverMedia: true,
  author: { select: { id: true, name: true, email: true } },
  category: true,
} satisfies Prisma.NewsInclude

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
  const orderBy: Prisma.NewsOrderByWithRelationInput =
    String(query.sort) === 'title'
      ? { title: 'asc' }
      : { publishedAt: 'desc' }

  const [total, rows] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({ where, include, orderBy, skip, take: limit }),
  ])
  return paginated(rows.map(mapNews), total, page, limit)
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

export async function createNews(body: unknown, authorId: string) {
  const data = newsInput.parse(body)
  const slug = data.slug ? slugify(data.slug) : slugify(data.title)
  const exists = await prisma.news.findUnique({ where: { slug } })
  if (exists) throw new AppError(409, 'Já existe uma notícia com este endereço de página.')

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
  await logActivity({ userId: authorId, action: 'create', entity: 'news', entityId: item.id })
  return mapNews(item)
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
  const status = data.status ?? current.status
  const item = await prisma.news.update({
    where: { id },
    data: {
      ...data,
      slug,
      publishedAt:
        status === 'PUBLISHED'
          ? data.publishedAt
            ? new Date(data.publishedAt)
            : current.publishedAt ?? new Date()
          : current.publishedAt,
    },
    include,
  })
  await logActivity({ userId, action: 'update', entity: 'news', entityId: id })
  return mapNews(item)
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
  const current = await getNewsById(id)
  return createNews(
    {
      title: `${current.title} (cópia)`,
      excerpt: current.excerpt,
      content: current.content,
      subtitle: current.subtitle,
      coverMediaId: current.coverMediaId,
      categoryId: current.categoryId,
      status: 'DRAFT',
      featured: false,
    },
    userId,
  )
}

export async function listCategories() {
  return prisma.newsCategory.findMany({ orderBy: { name: 'asc' } })
}
