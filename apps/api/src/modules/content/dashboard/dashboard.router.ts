import type { FastifyInstance } from 'fastify'
import { authenticate, authorize } from '../../../middlewares/authorize.js'
import * as dashboardController from './dashboard.controller.js'

export async function dashboardRouter(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: [authorize('DASHBOARD_VIEW')] }, dashboardController.dashboard)
  app.get('/notifications', { preHandler: [authenticate()] }, dashboardController.notifications)
}
