import type { FastifyReply, FastifyRequest } from 'fastify'
import type { EventInput, EventUpdate } from './events.schema.js'
import * as eventsService from './events.service.js'

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const hasAuthorization = Boolean(request.headers.authorization)
  return reply.send(await eventsService.listEvents(request.query as Record<string, unknown>, hasAuthorization))
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await eventsService.createEvent(request.body as EventInput, request.authUser!.id))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await eventsService.updateEvent(id, request.body as EventUpdate, request.authUser!.id))
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await eventsService.deleteEvent(id, request.authUser!.id))
}
