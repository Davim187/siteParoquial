import type { FastifyInstance } from 'fastify'
import { authorize } from '../../../middlewares/authorize.js'
import { validate } from '../../../middlewares/validate.js'
import * as pastoralsController from './pastorals.controller.js'
import { createPastoralSchema, updatePastoralSchema } from './pastorals.schema.js'

export async function pastoralsRouter(app: FastifyInstance) {
  app.get('/pastorals', pastoralsController.list)
  app.get('/pastorals/:slug', pastoralsController.getBySlug)
  app.post('/pastorals', {
    preValidation: [validate({ body: createPastoralSchema })],
    preHandler: [authorize('PASTORALS_MANAGE')],
  }, pastoralsController.create)
  app.put('/pastorals/:id', {
    preValidation: [validate({ body: updatePastoralSchema })],
    preHandler: [authorize('PASTORALS_MANAGE')],
  }, pastoralsController.update)
  app.delete('/pastorals/:id', { preHandler: [authorize('PASTORALS_MANAGE')] }, pastoralsController.remove)
}
