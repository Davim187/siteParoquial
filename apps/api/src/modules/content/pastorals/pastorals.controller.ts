import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PastoralInput, PastoralUpdate } from './pastorals.schema.js'
import * as pastoralsService from './pastorals.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await pastoralsService.listPastorals(request.query as Record<string, unknown>))
}

export async function getBySlug(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string }
  return reply.send(await pastoralsService.getPastoral(slug))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await pastoralsService.createPastoral(request.body as PastoralInput, request.authUser!.id))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await pastoralsService.updatePastoral(id, request.body as PastoralUpdate))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await pastoralsService.deletePastoral(id))
}
