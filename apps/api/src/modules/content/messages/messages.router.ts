import type { FastifyInstance } from 'fastify'
import { authorize } from '../../../middlewares/authorize.js'
import { validate } from '../../../middlewares/validate.js'
import * as messagesController from './messages.controller.js'
import { createMessageSchema, updateMessageSchema } from './messages.schema.js'

export async function messagesRouter(app: FastifyInstance) {
  app.post('/contact', { preValidation: [validate({ body: createMessageSchema })] }, messagesController.create)
  app.get('/messages', { preHandler: [authorize('MESSAGES_MANAGE')] }, messagesController.list)
  app.patch('/messages/:id', {
    preValidation: [validate({ body: updateMessageSchema })],
    preHandler: [authorize('MESSAGES_MANAGE')],
  }, messagesController.update)
}
