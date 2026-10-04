import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

export function findSettings() {
  return prisma.parishSettings.findUnique({ where: { id: 'default' } })
}

export function updateSettings(data: Prisma.ParishSettingsUpdateInput) {
  return prisma.parishSettings.update({ where: { id: 'default' }, data })
}
