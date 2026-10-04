import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PersonInput, PersonUpdate } from './people.schema.js'
import * as peopleService from './people.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await peopleService.listPeople(request.query as Record<string, unknown>))
}

export async function getBySlug(request: FastifyRequest, reply: FastifyReply) {
  const { slug } = request.params as { slug: string }
  return reply.send(await peopleService.getPerson(slug))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await peopleService.createPerson(request.body as PersonInput))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await peopleService.updatePerson(id, request.body as PersonUpdate))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await peopleService.deletePerson(id))
}
