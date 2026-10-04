import type { FastifyReply, FastifyRequest } from 'fastify'
import type { NoticeInput, NoticeUpdate } from './notices.schema.js'
import * as noticesService from './notices.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const hasAuthorization = Boolean(request.headers.authorization)
  return reply.send(await noticesService.listNotices(request.query as Record<string, unknown>, hasAuthorization))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await noticesService.createNotice(request.body as NoticeInput, request.authUser!.id))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await noticesService.updateNotice(id, request.body as NoticeUpdate, request.authUser!.id))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await noticesService.deleteNotice(id, request.authUser!.id))
}

export async function featured(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await noticesService.listFeaturedNotices())
}
