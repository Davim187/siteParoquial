import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

const include = { media: true } satisfies Prisma.GalleryItemInclude

export function countGalleryItems(where: Prisma.GalleryItemWhereInput) {
  return prisma.galleryItem.count({ where })
}

export function findGalleryItems(args: { where: Prisma.GalleryItemWhereInput; skip: number; take: number }) {
  return prisma.galleryItem.findMany({
    where: args.where,
    include,
    orderBy: { date: 'desc' },
    skip: args.skip,
    take: args.take,
  })
}

export function createGalleryItem(data: Prisma.GalleryItemUncheckedCreateInput) {
  return prisma.galleryItem.create({ data, include })
}

export function deleteGalleryItem(id: string) {
  return prisma.galleryItem.delete({ where: { id } })
}
