import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

const include = { image: true } satisfies Prisma.NoticeInclude

export function countNotices(where: Prisma.NoticeWhereInput) {
  return prisma.notice.count({ where })
}

export function findNotices(args: {
  where: Prisma.NoticeWhereInput
  skip: number
  take: number
}) {
  return prisma.notice.findMany({
    where: args.where,
    include,
    orderBy: [{ featured: 'desc' }, { priority: 'desc' }, { startsAt: 'desc' }],
    skip: args.skip,
    take: args.take,
  })
}

export function createNotice(data: Prisma.NoticeUncheckedCreateInput) {
  return prisma.notice.create({ data, include })
}

export function updateNotice(id: string, data: Prisma.NoticeUncheckedUpdateInput) {
  return prisma.notice.update({ where: { id }, data, include })
}

export function deleteNotice(id: string) {
  return prisma.notice.delete({ where: { id } })
}

export function findFeaturedNotices(now: Date) {
  return prisma.notice.findMany({
    where: {
      active: true,
      featured: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    include,
    orderBy: [{ priority: 'desc' }, { startsAt: 'desc' }],
  })
}
