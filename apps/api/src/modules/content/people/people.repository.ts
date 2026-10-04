import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

const include = { photo: true } satisfies Prisma.PersonInclude

export function findPeople(where: Prisma.PersonWhereInput) {
  return prisma.person.findMany({
    where,
    include,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
}

export function findPersonBySlug(slug: string) {
  return prisma.person.findUnique({ where: { slug }, include })
}

export function createPerson(data: Prisma.PersonUncheckedCreateInput) {
  return prisma.person.create({ data, include })
}

export function updatePerson(id: string, data: Prisma.PersonUncheckedUpdateInput) {
  return prisma.person.update({ where: { id }, data, include })
}

export function deletePerson(id: string) {
  return prisma.person.delete({ where: { id } })
}
