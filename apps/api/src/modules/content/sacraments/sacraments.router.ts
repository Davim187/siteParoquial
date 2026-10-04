import type { FastifyInstance } from 'fastify'
import { authorize } from '../../../middlewares/authorize.js'
import { validate } from '../../../middlewares/validate.js'
import * as sacramentsController from './sacraments.controller.js'
import { updateSacramentSchema } from './sacraments.schema.js'

export async function sacramentsRouter(app: FastifyInstance) {
  app.get('/sacraments', sacramentsController.list)
  app.get('/sacraments/:slug', sacramentsController.getBySlug)
  app.put('/sacraments/:id', {
    preValidation: [validate({ body: updateSacramentSchema })],
    preHandler: [authorize('SACRAMENTS_MANAGE')],
  }, sacramentsController.update)
}
