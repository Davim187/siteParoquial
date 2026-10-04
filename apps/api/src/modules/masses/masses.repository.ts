import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

export function countMasses(where: Prisma.MassScheduleWhereInput) {
  return prisma.massSchedule.count({ where })
}

export function findMasses(args: {
  where: Prisma.MassScheduleWhereInput
  skip: number
  take: number
}) {
  return prisma.massSchedule.findMany({
    where: args.where,
    orderBy: [{ date: 'asc' }, { weekday: 'asc' }, { time: 'asc' }],
    skip: args.skip,
    take: args.take,
  })
}

export function findActiveMasses() {
  return prisma.massSchedule.findMany({ where: { active: true } })
}

export function findWeeklyMasses() {
  return prisma.massSchedule.findMany({
    where: { active: true, date: null, weekday: { not: null } },
    orderBy: [{ weekday: 'asc' }, { time: 'asc' }],
  })
}

export function createMass(data: Prisma.MassScheduleUncheckedCreateInput) {
  return prisma.massSchedule.create({ data })
}

export function updateMass(id: string, data: Prisma.MassScheduleUncheckedUpdateInput) {
  return prisma.massSchedule.update({ where: { id }, data })
}

export function deleteMass(id: string) {
  return prisma.massSchedule.delete({ where: { id } })
}
