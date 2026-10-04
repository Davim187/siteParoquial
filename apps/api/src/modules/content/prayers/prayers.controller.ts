import type { FastifyReply, FastifyRequest } from 'fastify'
import type { PrayerInput, PrayerUpdate } from './prayers.schema.js'
import * as prayersService from './prayers.service.js'

export async function create(request: FastifyRequest, reply: FastifyReply) {
  return reply.status(201).send(await prayersService.createPrayer(request.body as PrayerInput))
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await prayersService.listPrayers(request.query as Record<string, unknown>))
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string }
  return reply.send(await prayersService.updatePrayer(id, request.body as PrayerUpdate))
}
