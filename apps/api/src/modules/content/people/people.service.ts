import type { PersonType, Prisma } from '@prisma/client'
import { AppError, slugify } from '../../../lib/http.js'
import { withImage } from '../serialize.js'
import type { PersonInput, PersonUpdate } from './people.schema.js'
import * as peopleRepository from './people.repository.js'

export async function listPeople(query: Record<string, unknown>) {
  const where: Prisma.PersonWhereInput = query.all === 'true' ? {} : { active: true }
  if (query.type) where.type = String(query.type) as PersonType
  const rows = await peopleRepository.findPeople(where)
  return { data: rows.map(withImage) }
}

export async function getPerson(slug: string) {
  const item = await peopleRepository.findPersonBySlug(slug)
  if (!item || !item.active) throw new AppError(404, 'Pessoa não encontrada.')
  return withImage(item)
}

export async function createPerson(data: PersonInput) {
  const item = await peopleRepository.createPerson({
    ...data,
    slug: data.slug ? slugify(data.slug) : slugify(data.name),
  })
  return withImage(item)
}

export async function updatePerson(id: string, data: PersonUpdate) {
  const item = await peopleRepository.updatePerson(id, {
    ...data,
    slug: data.slug ? slugify(data.slug) : data.name ? slugify(data.name) : undefined,
  })
  return withImage(item)
}

export async function deletePerson(id: string) {
  await peopleRepository.deletePerson(id)
  return { ok: true }
}
