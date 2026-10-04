import type { FastifyInstance } from 'fastify'
import { authorize, authorizeAny } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as mediaController from './media.controller.js'
import { updateMediaSchema } from './media.schema.js'

export async function mediaRouter(app: FastifyInstance) {
  app.get('/media', { preHandler: [authorize('MEDIA_MANAGE')] }, mediaController.list)
  app.post('/media/upload', { preHandler: [authorize('MEDIA_MANAGE')] }, mediaController.upload)
  app.delete('/media/:id', { preHandler: [authorize('MEDIA_MANAGE')] }, mediaController.remove)
  app.patch('/media/:id', {
    preValidation: [validate({ body: updateMediaSchema })],
    preHandler: [authorizeAny('MEDIA_MANAGE')],
  }, mediaController.update)
}
