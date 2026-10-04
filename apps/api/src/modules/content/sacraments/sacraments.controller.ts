import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SacramentUpdate } from './sacraments.schema.js'
import * as sacramentsService from './sacraments.service.js'

export async function list(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await sacramentsService.listSacraments())
}

export async function getBySlug(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string }
  return reply.send(await sacramentsService.getSacrament(slug))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await sacramentsService.updateSacrament(id, request.body as SacramentUpdate))
}
