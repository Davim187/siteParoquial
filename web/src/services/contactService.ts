import { apiRequest } from '@/lib/api-client'
import type { ContactMessage } from '@/types'

export async function listMessages() {
  const result = await apiRequest<{ data: any[] }>('/api/messages')
  return result.data.map(
    (item): ContactMessage => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone ?? '',
      subject: item.subject,
      message: item.message,
      createdAt: item.createdAt,
      status: item.status === 'NEW' ? 'new' : item.status === 'READ' ? 'read' : 'replied',
    }),
  )
}

export async function submitContactMessage(
  input: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>,
) {
  return apiRequest('/api/contact', { method: 'POST', auth: false, json: input })
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']) {
  const map = { new: 'NEW', read: 'READ', replied: 'REPLIED' } as const
  await apiRequest(`/api/messages/${id}`, { method: 'PATCH', json: { status: map[status] } })
}

export async function deleteMessage(_id: string) {
  return { ok: true }
}
