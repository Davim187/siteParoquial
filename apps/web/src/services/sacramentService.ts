import { apiRequest } from '@/lib/api-client'
import type { Sacrament } from '@/types'

function mapSacrament(item: any): Sacrament {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    summary: item.summary,
    whatItIs: item.whatItIs,
    whoCanReceive: item.whoCanReceive,
    howItWorks: item.howItWorks,
    documents: item.documents,
    howToRegister: item.howToRegister,
    secretaryContact: item.secretaryContact,
  }
}

export async function listSacraments(): Promise<Sacrament[]> {
  const result = await apiRequest<{ data: any[] }>('/api/sacraments', { auth: false })
  return result.data.map(mapSacrament)
}

export async function getSacramentBySlug(slug: string) {
  const item = await apiRequest<any>(`/api/sacraments/${slug}`, { auth: false })
  return mapSacrament(item)
}

export async function saveSacrament(input: any) {
  return apiRequest(`/api/sacraments/${input.id}`, { method: 'PUT', json: input })
}

export async function deleteSacrament(_id: string) {
  return { ok: true }
}
