import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

const include = { image: true } satisfies Prisma.PastoralInclude

export function findPastorals(where: Prisma.PastoralWhereInput) {
  return prisma.pastoral.findMany({ where, include, orderBy: { name: 'asc' } })
}

export function findPastoralBySlug(slug: string) {
  return prisma.pastoral.findUnique({ where: { slug }, include })
}

export function createPastoral(data: Prisma.PastoralUncheckedCreateInput) {
  return prisma.pastoral.create({ data, include })
}

export function updatePastoral(id: string, data: Prisma.PastoralUncheckedUpdateInput) {
  return prisma.pastoral.update({ where: { id }, data, include })
}

export function deletePastoral(id: string) {
  return prisma.pastoral.delete({ where: { id } })
}
