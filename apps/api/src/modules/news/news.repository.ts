                    import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export const newsInclude = {
  coverMedia: true,
  author: { select: { id: true, name: true, email: true } },
  category: true,
  galleryImages: { include: { media: true }, orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.NewsInclude

const publicListInclude = {
  coverMedia: true,
  author: { select: { id: true, name: true, email: true } },
  category: true,
} satisfies Prisma.NewsInclude

export function countNews(where: Prisma.NewsWhereInput) {
  return prisma.news.count({ where })
}

export function findNews(args: {
  where: Prisma.NewsWhereInput
  orderBy: Prisma.NewsOrderByWithRelationInput[]
  skip: number
  take: number
  publicOnly?: boolean
}) {
  return prisma.news.findMany({
    where: args.where,
    include: args.publicOnly ? publicListInclude : newsInclude,
    orderBy: args.orderBy,
    skip: args.skip,
    take: args.take,
  })
}

export function findCampaignNews() {
  return prisma.news.findFirst({
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
      progressLabel: true,
      progressCurrent: true,
      progressGoal: true,
      publishedAt: true,
      createdAt: true,
      coverMedia: true,
      category: true,
    },
  })
}

export function findNewsBySlug(slug: string) {
  return prisma.news.findUnique({ where: { slug }, include: newsInclude })
}

export function findNewsById(id: string) {
  return prisma.news.findUnique({ where: { id }, include: newsInclude })
}

export function findNewsRecordById(id: string) {
  return prisma.news.findUnique({ where: { id } })
}

export function findNewsIdBySlug(slug: string) {
  return prisma.news.findUnique({ where: { slug } })
}

export function createNews(data: Prisma.NewsUncheckedCreateInput) {
  return prisma.news.create({ data, include: newsInclude })
}

export function updateNews(id: string, data: Prisma.NewsUncheckedUpdateInput) {
  return prisma.news.update({ where: { id }, data, include: newsInclude })
}

export function deleteNews(id: string) {
  return prisma.news.delete({ where: { id } })
}

export function findNewsByIdOrThrow(id: string) {
  return prisma.news.findUniqueOrThrow({ where: { id }, include: newsInclude })
}

export async function replaceGallery(newsId: string, mediaIds?: string[]) {
  if (!mediaIds) return
  await prisma.newsImage.deleteMany({ where: { newsId } })
  if (mediaIds.length === 0) return
  await prisma.newsImage.createMany({
    data: mediaIds.map((mediaId, sortOrder) => ({ newsId, mediaId, sortOrder })),
  })
}

export function clearOtherFeatured(id: string) {
  return prisma.news.updateMany({
    where: { featured: true, id: { not: id } },
    data: { featured: false },
  })
}

export function findNewsForDuplicate(id: string) {
  return prisma.news.findUnique({
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
      progressLabel: true,
      progressCurrent: true,
      progressGoal: true,
      galleryImages: { select: { mediaId: true, sortOrder: true } },
    },
  })
}

export function listCategories() {
  return prisma.newsCategory.findMany({ orderBy: { name: 'asc' } })
}
