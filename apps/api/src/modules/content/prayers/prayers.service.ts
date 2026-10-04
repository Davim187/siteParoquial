import { paginated, parsePagination } from '../../../lib/http.js'
import type { PrayerInput, PrayerUpdate } from './prayers.schema.js'
import * as prayersRepository from './prayers.repository.js'

export async function createPrayer(data: PrayerInput) {
  const item = await prayersRepository.createPrayer({
    name: data.anonymous ? 'Anônimo' : data.name,
    email: data.anonymous ? null : data.email ?? null,
    request: data.request,
    anonymous: data.anonymous,
  })
  return {
    message: 'Seu pedido foi recebido. Que Deus abençoe você e sua família.',
    id: item.id,
  }
}

export async function listPrayers(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query)
  const [total, data] = await Promise.all([
    prayersRepository.countPrayers(),
    prayersRepository.findPrayers(skip, limit),
  ])
  return paginated(data, total, page, limit)
}

export async function updatePrayer(id: string, data: PrayerUpdate) {
  return prayersRepository.updatePrayer(id, data)
}
