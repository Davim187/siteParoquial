import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

const include = { image: true } satisfies Prisma.SacramentInclude

export function findActiveSacraments() {
  return prisma.sacrament.findMany({
    where: { active: true },
    include,
    orderBy: { sortOrder: 'asc' },
  })
}

export function findSacramentBySlug(slug: string) {
  return prisma.sacrament.findUnique({ where: { slug }, include })
}

export function updateSacrament(id: string, data: Prisma.SacramentUncheckedUpdateInput) {
  return prisma.sacrament.update({ where: { id }, data, include })
}
