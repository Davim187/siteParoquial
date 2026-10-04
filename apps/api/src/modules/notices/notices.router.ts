import type { FastifyInstance } from 'fastify'
import { authorize } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as noticesController from './notices.controller.js'
import { noticeSchema, updateNoticeSchema } from './notices.schema.js'

export async function noticesRouter(app: FastifyInstance) {
  app.get('/notices', noticesController.list)
  app.post('/notices', {
    preValidation: [validate({ body: noticeSchema })],
    preHandler: [authorize('NOTICES_MANAGE')],
  }, noticesController.create)
  app.put('/notices/:id', {
    preValidation: [validate({ body: updateNoticeSchema })],
    preHandler: [authorize('NOTICES_MANAGE')],
  }, noticesController.update)
  app.delete('/notices/:id', { preHandler: [authorize('NOTICES_MANAGE')] }, noticesController.remove)
  app.get('/notices/featured', noticesController.featured)
}
