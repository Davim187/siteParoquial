import { AppError, paginated, parsePagination } from '../../../lib/http.js'
import type { MessageInput, MessageUpdate } from './messages.schema.js'
import * as messagesRepository from './messages.repository.js'

export type MessageStore = Pick<
  typeof messagesRepository,
  'createMessage' | 'countMessages' | 'findMessages' | 'updateMessage' | 'deleteMessage'
>

function isMissingRecord(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2022'
}

export async function createMessage(data: MessageInput, store: MessageStore = messagesRepository) {
  const item = await store.createMessage({
    ...data,
    phone: data.phone?.trim() ? data.phone.trim() : null,
  })
  return { message: 'Mensagem enviada com sucesso.', id: item.id }
}

export async function listMessages(query: Record<string, unknown>, store: MessageStore = messagesRepository) {
  const { page, limit, skip } = parsePagination(query)
  const [total, data] = await Promise.all([
    store.countMessages(),
    store.findMessages(skip, limit),
  ])
  return paginated(data, total, page, limit)
}

export async function updateMessage(id: string, data: MessageUpdate, store: MessageStore = messagesRepository) {
  try {
    return await store.updateMessage(id, data)
  } catch (error) {
    if (isMissingRecord(error)) throw new AppError(404, 'Mensagem não encontrada.')
    throw error
  }
}

export async function deleteMessage(id: string, store: MessageStore = messagesRepository) {
  try {
    await store.deleteMessage(id)
  } catch (error) {
    if (isMissingRecord(error)) throw new AppError(404, 'Mensagem não encontrada.')
    throw error
  }
  return { ok: true }
}
