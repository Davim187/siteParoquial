import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

export function createPrayer(data: Prisma.PrayerRequestUncheckedCreateInput) {
  return prisma.prayerRequest.create({ data })
}

export function countPrayers() {
  return prisma.prayerRequest.count()
}

export function findPrayers(skip: number, take: number) {
  return prisma.prayerRequest.findMany({ orderBy: { createdAt: 'desc' }, skip, take })
}

export function updatePrayer(id: string, data: Prisma.PrayerRequestUpdateInput) {
  return prisma.prayerRequest.update({ where: { id }, data })
}
