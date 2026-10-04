import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as authController from './auth.controller.js'
import { loginSchema, logoutSchema, refreshSchema } from './auth.schema.js'

export async function authRouter(app: FastifyInstance) {
  app.post('/auth/login', { preValidation: [validate({ body: loginSchema })] }, authController.login)
  app.post('/auth/refresh', { preValidation: [validate({ body: refreshSchema })] }, authController.refresh)
  app.post('/auth/logout', { preValidation: [validate({ body: logoutSchema })] }, authController.logout)
  app.get('/auth/me', { preHandler: [authenticate()] }, authController.me)
}
