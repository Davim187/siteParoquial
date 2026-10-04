import type { FastifyInstance } from 'fastify'
import { authorize } from '../../../middlewares/authorize.js'
import { validate } from '../../../middlewares/validate.js'
import * as prayersController from './prayers.controller.js'
import { createPrayerSchema, updatePrayerSchema } from './prayers.schema.js'

export async function prayersRouter(app: FastifyInstance) {
  app.post('/prayers', { preValidation: [validate({ body: createPrayerSchema })] }, prayersController.create)
  app.get('/prayers', { preHandler: [authorize('PRAYERS_MANAGE')] }, prayersController.list)
  app.patch('/prayers/:id', {
    preValidation: [validate({ body: updatePrayerSchema })],
    preHandler: [authorize('PRAYERS_MANAGE')],
  }, prayersController.update)
}
