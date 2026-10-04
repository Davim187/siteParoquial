import type { Prisma } from '@prisma/client'
import { AppError, slugify } from '../../../lib/http.js'
import { logActivity } from '../../../lib/activity.js'
import { withImage } from '../serialize.js'
import type { PastoralInput, PastoralUpdate } from './pastorals.schema.js'
import * as pastoralsRepository from './pastorals.repository.js'

export async function listPastorals(query: Record<string, unknown>) {
  const where: Prisma.PastoralWhereInput = query.all === 'true' ? {} : { active: true }
  const rows = await pastoralsRepository.findPastorals(where)
  return { data: rows.map(withImage) }
}

export async function getPastoral(slug: string) {
  const item = await pastoralsRepository.findPastoralBySlug(slug)
  if (!item || !item.active) throw new AppError(404, 'Pastoral não encontrada.')
  return withImage(item)
}

export async function createPastoral(data: PastoralInput, userId: string) {
  const item = await pastoralsRepository.createPastoral({
    ...data,
    email: data.email || null,
    slug: data.slug ? slugify(data.slug) : slugify(data.name),
  })
  await logActivity({ userId, action: 'create', entity: 'pastoral', entityId: item.id })
  return withImage(item)
}

export async function updatePastoral(id: string, data: PastoralUpdate) {
  const item = await pastoralsRepository.updatePastoral(id, {
    ...data,
    slug: data.slug ? slugify(data.slug) : data.name ? slugify(data.name) : undefined,
  })
  return withImage(item)
}

export async function deletePastoral(id: string) {
  await pastoralsRepository.deletePastoral(id)
  return { ok: true }
}
