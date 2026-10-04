import type { FastifyInstance } from 'fastify'
import { authorize, authorizeAny } from '../../middlewares/authorize.js'
import { validate } from '../../middlewares/validate.js'
import * as newsController from './news.controller.js'
import { newsInputSchema, newsStatusSchema, updateNewsSchema } from './news.schema.js'

export async function newsRouter(app: FastifyInstance) {
  app.get('/news', newsController.list)
  app.get('/news/categories', newsController.listCategories)
  app.get('/news/campaign', newsController.campaign)
  app.get('/news/:slug', newsController.getBySlug)
  app.get('/admin/news/:id', { preHandler: [authorizeAny('NEWS_VIEW', 'NEWS_MANAGE')] }, newsController.getById)
  app.post('/news', {
    preValidation: [validate({ body: newsInputSchema })],
    preHandler: [authorizeAny('NEWS_CREATE', 'NEWS_MANAGE')],
  }, newsController.create)
  app.put('/news/:id', {
    preValidation: [validate({ body: updateNewsSchema })],
    preHandler: [authorizeAny('NEWS_EDIT', 'NEWS_MANAGE')],
  }, newsController.update)
  app.patch('/news/:id/status', {
    preValidation: [validate({ body: newsStatusSchema })],
    preHandler: [authorizeAny('NEWS_EDIT', 'NEWS_MANAGE')],
  }, newsController.updateStatus)
  app.post('/news/:id/duplicate', { preHandler: [authorizeAny('NEWS_CREATE', 'NEWS_MANAGE')] }, newsController.duplicate)
  app.delete('/news/:id', { preHandler: [authorize('NEWS_DELETE')] }, newsController.remove)
}
