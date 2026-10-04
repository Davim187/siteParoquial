import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

const include = { image: true } satisfies Prisma.EventInclude

export function countEvents(where: Prisma.EventWhereInput) {
  return prisma.event.count({ where })
}

export function findEvents(args: {
  where: Prisma.EventWhereInput
  skip: number
  take: number
}) {
  return prisma.event.findMany({
    where: args.where,
    include,
    orderBy: { startsAt: 'asc' },
    skip: args.skip,
    take: args.take,
  })
}

export function createEvent(data: Prisma.EventUncheckedCreateInput) {
  return prisma.event.create({ data, include })
}

export function updateEvent(id: string, data: Prisma.EventUncheckedUpdateInput) {
  return prisma.event.update({ where: { id }, data, include })
}

export function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } })
}
