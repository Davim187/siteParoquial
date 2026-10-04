import type { FastifyReply, FastifyRequest } from 'fastify'
import type { LoginInput, LogoutInput, RefreshInput } from './auth.schema.js'
import * as authService from './auth.service.js'

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.login(request.server, request.body as LoginInput)
  return reply.send(result)
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.refresh(request.server, request.body as RefreshInput)
  return reply.send(result)
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.logout(request.body as LogoutInput)
  return reply.send(result)
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ user: request.authUser })
}
