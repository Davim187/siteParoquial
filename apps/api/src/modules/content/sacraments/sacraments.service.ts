import { AppError } from '../../../lib/http.js'
import { withImage } from '../serialize.js'
import type { SacramentUpdate } from './sacraments.schema.js'
import * as sacramentsRepository from './sacraments.repository.js'

export async function listSacraments() {
  const rows = await sacramentsRepository.findActiveSacraments()
  return { data: rows.map(withImage) }
}

export async function getSacrament(slug: string) {
  const item = await sacramentsRepository.findSacramentBySlug(slug)
  if (!item || !item.active) throw new AppError(404, 'Sacramento não encontrado.')
  return withImage(item)
}

export async function updateSacrament(id: string, data: SacramentUpdate) {
  const item = await sacramentsRepository.updateSacrament(id, data)
  return withImage(item)
}
