import type { FastifyInstance } from 'fastify'
import { authorize } from '../../../middlewares/authorize.js'
import { validate } from '../../../middlewares/validate.js'
import * as settingsController from './settings.controller.js'
import { updateSettingsSchema } from './settings.schema.js'

export async function settingsRouter(app: FastifyInstance) {
  app.get('/settings', settingsController.get)
  app.put('/settings', {
    preValidation: [validate({ body: updateSettingsSchema })],
    preHandler: [authorize('SETTINGS_MANAGE')],
  }, settingsController.update)
}
