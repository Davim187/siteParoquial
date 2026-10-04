import type { FastifyInstance } from 'fastify'
import { authorize } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as massesController from './masses.controller.js'
import { massSchema, updateMassSchema } from './masses.schema.js'

export async function massesRouter(app: FastifyInstance) {
  app.get('/masses', massesController.list)
  app.get('/masses/upcoming', massesController.upcoming)
  app.get('/masses/weekly', massesController.weekly)
  app.post('/masses', {
    preValidation: [validate({ body: massSchema })],
    preHandler: [authorize('MASSES_MANAGE')],
  }, massesController.create)
  app.put('/masses/:id', {
    preValidation: [validate({ body: updateMassSchema })],
    preHandler: [authorize('MASSES_MANAGE')],
  }, massesController.update)
  app.delete('/masses/:id', { preHandler: [authorize('MASSES_MANAGE')] }, massesController.remove)
}
