import type { FastifyReply, FastifyRequest } from 'fastify'
import type { MessageInput, MessageUpdate } from './messages.schema.js'
import * as messagesService from './messages.service.js'

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await messagesService.createMessage(request.body as MessageInput))
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await messagesService.listMessages(request.query as Record<string, unknown>))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await messagesService.updateMessage(id, request.body as MessageUpdate))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await messagesService.deleteMessage(id))
}
