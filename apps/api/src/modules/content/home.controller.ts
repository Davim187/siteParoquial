import type { FastifyReply, FastifyRequest } from 'fastify'
import * as homeService from './home.service.js'

export async function home(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await homeService.getHomeBootstrap())
}
