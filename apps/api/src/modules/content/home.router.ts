import type { FastifyInstance } from 'fastify'
import * as homeController from './home.controller.js'

export async function homeRouter(app: FastifyInstance) {
  app.get('/home', homeController.home)
}
