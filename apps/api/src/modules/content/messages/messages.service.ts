import { paginated, parsePagination } from '../../../lib/http.js'
import type { MessageInput, MessageUpdate } from './messages.schema.js'
import * as messagesRepository from './messages.repository.js'

export async function createMessage(data: MessageInput) {
  const item = await messagesRepository.createMessage(data)
  return { message: 'Mensagem enviada com sucesso.', id: item.id }
}

export async function listMessages(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query)
  const [total, data] = await Promise.all([
    messagesRepository.countMessages(),
    messagesRepository.findMessages(skip, limit),
  ])
  return paginated(data, total, page, limit)
}

export async function updateMessage(id: string, data: MessageUpdate) {
  return messagesRepository.updateMessage(id, data)
}
