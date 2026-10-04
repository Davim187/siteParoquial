import type { FastifyReply, FastifyRequest } from 'fastify'
import type { MassInput, MassUpdate } from './masses.schema.js'
import * as massesService from './masses.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await massesService.listMasses(request.query as Record<string, unknown>))
}

export async function upcoming(request: FastifyRequest, reply: FastifyReply) {
  const limit = (request.query as { limit?: string }).limit
  return reply.send(await massesService.listUpcoming(limit))
}

export async function weekly(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await massesService.listWeekly())
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await massesService.createMass(request.body as MassInput, request.authUser!.id))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await massesService.updateMass(id, request.body as MassUpdate, request.authUser!.id))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await massesService.deleteMass(id, request.authUser!.id))
}
