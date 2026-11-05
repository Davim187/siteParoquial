import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as authController from './auth.controller.js'
import { forgotPasswordSchema, loginSchema, logoutSchema, refreshSchema, resetPasswordSchema } from './auth.schema.js'

const resetLimit = { config: { rateLimit: { max: 8, timeWindow: '15 minutes' } } }

export async function authRouter(app: FastifyInstance) {
  app.post('/auth/login', { preValidation: [validate({ body: loginSchema })] }, authController.login)
  app.post('/auth/refresh', { preValidation: [validate({ body: refreshSchema })] }, authController.refresh)
  app.post('/auth/logout', { preValidation: [validate({ body: logoutSchema })] }, authController.logout)
  app.post('/auth/forgot-password', { ...resetLimit, preValidation: [validate({ body: forgotPasswordSchema })] }, authController.forgotPassword)
  app.post('/auth/reset-password', { ...resetLimit, preValidation: [validate({ body: resetPasswordSchema })] }, authController.resetPassword)
  app.get('/auth/me', { preHandler: [authenticate()] }, authController.me)
}
