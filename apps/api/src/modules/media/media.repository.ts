import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export function countMedia(where: Prisma.MediaWhereInput) {
  return prisma.media.count({ where })
}

export function findMedia(args: { where: Prisma.MediaWhereInput; skip: number; take: number }) {
  return prisma.media.findMany({
    where: args.where,
    orderBy: { createdAt: 'desc' },
    skip: args.skip,
    take: args.take,
  })
}

export function createMedia(data: Prisma.MediaUncheckedCreateInput) {
  return prisma.media.create({ data })
}

export function findMediaById(id: string) {
  return prisma.media.findUnique({ where: { id } })
}

export function deleteMedia(id: string) {
  return prisma.media.delete({ where: { id } })
}

export function updateMedia(id: string, data: Prisma.MediaUpdateInput) {
  return prisma.media.update({ where: { id }, data })
}
