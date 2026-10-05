import { apiRequest } from '@/lib/api-client'
import { deleteMessageRequest, mapMessageStatus, updateMessageRequest } from '@/services/contact-form'
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
      status: mapMessageStatus(item.status),
    }),
  )
}

export async function submitContactMessage(
  input: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>,
) {
  return apiRequest('/api/contact', { method: 'POST', auth: false, json: input })
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']) {
  const request = updateMessageRequest(id, status)
  await apiRequest(request.path, { method: request.method, json: request.json })
}

export async function deleteMessage(id: string) {
  const request = deleteMessageRequest(id)
  return apiRequest(request.path, { method: request.method })
}
