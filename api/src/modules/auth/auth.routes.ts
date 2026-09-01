import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/authorize.js'
import * as authService from './auth.service.js'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const result = await authService.login(app, request.body)
    return reply.send(result)
  })

  app.post('/auth/refresh', async (request, reply) => {
    const result = await authService.refresh(app, request.body)
    return reply.send(result)
  })

  app.post('/auth/logout', async (request, reply) => {
    const result = await authService.logout(request.body)
    return reply.send(result)
  })

  app.get('/auth/me', { preHandler: [authenticate()] }, async (request, reply) => {
    return reply.send({ user: request.authUser })
  })
}
