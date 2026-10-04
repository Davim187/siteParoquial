import type { FastifyInstance } from 'fastify'
import { authorize } from '../../../middlewares/authorize.js'
import { validate } from '../../../middlewares/validate.js'
import * as peopleController from './people.controller.js'
import { createPersonSchema, updatePersonSchema } from './people.schema.js'

export async function peopleRouter(app: FastifyInstance) {
  app.get('/people', peopleController.list)
  app.get('/people/:slug', peopleController.getBySlug)
  app.post('/people', {
    preValidation: [validate({ body: createPersonSchema })],
    preHandler: [authorize('PEOPLE_MANAGE')],
  }, peopleController.create)
  app.put('/people/:id', {
    preValidation: [validate({ body: updatePersonSchema })],
    preHandler: [authorize('PEOPLE_MANAGE')],
  }, peopleController.update)
  app.delete('/people/:id', { preHandler: [authorize('PEOPLE_MANAGE')] }, peopleController.remove)
}
