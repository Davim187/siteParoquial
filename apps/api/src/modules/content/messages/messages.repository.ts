import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

export function createMessage(data: Prisma.ContactMessageUncheckedCreateInput) {
  return prisma.contactMessage.create({ data })
}

export function countMessages() {
  return prisma.contactMessage.count()
}

export function findMessages(skip: number, take: number) {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip, take })
}

export function updateMessage(id: string, data: Prisma.ContactMessageUpdateInput) {
  return prisma.contactMessage.update({ where: { id }, data })
}
