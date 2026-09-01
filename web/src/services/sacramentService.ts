import { apiRequest } from '@/lib/api-client'
import type { Sacrament } from '@/types'

export async function listSacraments() {
  const result = await apiRequest<{ data: any[] }>('/api/sacraments', { auth: false })
  return result.data.map(
    (item): Sacrament => ({
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
    }),
  )
}

export async function getSacramentBySlug(slug: string) {
  const list = await listSacraments()
  return list.find((item) => item.slug === slug)
}

export async function saveSacrament(input: any) {
  return apiRequest(`/api/sacraments/${input.id}`, { method: 'PUT', json: input })
}

export async function deleteSacrament(_id: string) {
  // Sacramentos básicos permanecem; desative via active=false no futuro.
  return { ok: true }
}
