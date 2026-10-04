import type { FastifyReply, FastifyRequest } from 'fastify'
import type { SettingsInput } from './settings.schema.js'
import * as settingsService from './settings.service.js'

export async function get(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await settingsService.getSettings())
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await settingsService.updateSettings(request.body as SettingsInput, request.authUser!.id))
}
