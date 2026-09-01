import type { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'

export async function logActivity(input: {
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  metadata?: Prisma.InputJsonValue
  ip?: string | null
}) {
  await prisma.activityLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? undefined,
      metadata: input.metadata,
      ip: input.ip ?? undefined,
    },
  })
}
