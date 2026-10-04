import type { FastifyInstance } from 'fastify'
import { authorize } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as eventsController from './events.controller.js'
import { eventSchema, updateEventSchema } from './events.schema.js'

export async function eventsRouter(app: FastifyInstance) {
  app.get('/events', eventsController.list)
  app.post('/events', {
    preValidation: [validate({ body: eventSchema })],
    preHandler: [authorize('EVENTS_MANAGE')],
  }, eventsController.create)
  app.put('/events/:id', {
    preValidation: [validate({ body: updateEventSchema })],
    preHandler: [authorize('EVENTS_MANAGE')],
  }, eventsController.update)
  app.delete('/events/:id', { preHandler: [authorize('EVENTS_MANAGE')] }, eventsController.remove)
}
