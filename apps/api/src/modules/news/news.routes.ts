import type { FastifyInstance } from 'fastify'
import { authorize, authorizeAny } from '../../middlewares/authorize.js'
import { tryOptionalAuth, hasAnyPermission } from '../../lib/access.js'
import * as newsService from './news.service.js'

export async function newsRoutes(app: FastifyInstance) {
  app.get('/news', async (request, reply) => {
    await tryOptionalAuth(request)
    const publicOnly = !hasAnyPermission(
      request,
      'NEWS_VIEW',
      'NEWS_MANAGE',
      'NEWS_CREATE',
      'NEWS_EDIT',
    )
    const result = await newsService.listNews(request.query as Record<string, unknown>, { publicOnly })
    return reply.send(result)
  })

  app.get('/news/categories', async (_request, reply) => {
    return reply.send({ data: await newsService.listCategories() })
  })

  app.get('/news/campaign', async (_request, reply) => {
    return reply.send({ data: await newsService.getCampaignNews() })
  })

  app.get('/news/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const result = await newsService.getNewsBySlug(slug, true)
    return reply.send(result)
  })

  app.get('/admin/news/:id', { preHandler: [authorizeAny('NEWS_VIEW', 'NEWS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await newsService.getNewsById(id))
  })

  app.post('/news', { preHandler: [authorizeAny('NEWS_CREATE', 'NEWS_MANAGE')] }, async (request, reply) => {
    const result = await newsService.createNews(request.body, request.authUser!.id)
    return reply.status(201).send(result)
  })

  app.put('/news/:id', { preHandler: [authorizeAny('NEWS_EDIT', 'NEWS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await newsService.updateNews(id, request.body, request.authUser!.id))
  })

  app.patch('/news/:id/status', { preHandler: [authorizeAny('NEWS_EDIT', 'NEWS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await newsService.updateNewsStatus(id, request.body, request.authUser!.id))
  })

  app.post('/news/:id/duplicate', { preHandler: [authorizeAny('NEWS_CREATE', 'NEWS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.status(201).send(await newsService.duplicateNews(id, request.authUser!.id))
  })

  app.delete('/news/:id', { preHandler: [authorize('NEWS_DELETE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    return reply.send(await newsService.deleteNews(id, request.authUser!.id))
  })
}
