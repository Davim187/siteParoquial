import type { FastifyReply, FastifyRequest } from 'fastify'
import * as dashboardService from './dashboard.service.js'

export async function dashboard(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await dashboardService.getDashboard())
}

export async function notifications(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await dashboardService.getNotifications())
}
