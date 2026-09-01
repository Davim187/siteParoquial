import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { GalleryCategory, PersonType, Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError, paginated, parsePagination, slugify } from '../../lib/http.js'
import { logActivity } from '../../lib/activity.js'
import { authorize, authenticate } from '../../middlewares/authorize.js'
import { toPublicMediaPath } from '../../lib/media-url.js'

function withImage(item: any) {
  const imageUrl = toPublicMediaPath(item.image?.url ?? item.photo?.url ?? null)
  const imageThumbUrl = toPublicMediaPath(item.image?.thumbnailUrl ?? item.photo?.thumbnailUrl ?? null)
  return {
    ...item,
    imageUrl,
    imageThumbUrl,
  }
}

export async function contentRoutes(app: FastifyInstance) {
  // Pastorais
  app.get('/pastorals', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const where: Prisma.PastoralWhereInput = query.all === 'true' ? {} : { active: true }
    const rows = await prisma.pastoral.findMany({ where, include: { image: true }, orderBy: { name: 'asc' } })
    return reply.send({ data: rows.map(withImage) })
  })
  app.get('/pastorals/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const item = await prisma.pastoral.findUnique({ where: { slug }, include: { image: true } })
    if (!item || !item.active) throw new AppError(404, 'Pastoral não encontrada.')
    return reply.send(withImage(item))
  })
  app.post('/pastorals', { preHandler: [authorize('PASTORALS_MANAGE')] }, async (request, reply) => {
    const data = z
      .object({
        name: z.string().min(2),
        slug: z.string().optional(),
        description: z.string().min(3),
        imageId: z.string().optional().nullable(),
        responsible: z.string().min(2),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable().or(z.literal('')),
        meetingTime: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        active: z.boolean().default(true),
      })
      .parse(request.body)
    const item = await prisma.pastoral.create({
      data: {
        ...data,
        email: data.email || null,
        slug: data.slug ? slugify(data.slug) : slugify(data.name),
      },
      include: { image: true },
    })
    await logActivity({ userId: request.authUser!.id, action: 'create', entity: 'pastoral', entityId: item.id })
    return reply.status(201).send(withImage(item))
  })
  app.put('/pastorals/:id', { preHandler: [authorize('PASTORALS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = z
      .object({
        name: z.string().min(2).optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        imageId: z.string().nullable().optional(),
        responsible: z.string().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        meetingTime: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        active: z.boolean().optional(),
      })
      .parse(request.body)
    const item = await prisma.pastoral.update({
      where: { id },
      data: { ...data, slug: data.slug ? slugify(data.slug) : data.name ? slugify(data.name) : undefined },
      include: { image: true },
    })
    return reply.send(withImage(item))
  })
  app.delete('/pastorals/:id', { preHandler: [authorize('PASTORALS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.pastoral.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // Sacramentos
  app.get('/sacraments', async (_request, reply) => {
    const rows = await prisma.sacrament.findMany({
      where: { active: true },
      include: { image: true },
      orderBy: { sortOrder: 'asc' },
    })
    return reply.send({ data: rows.map(withImage) })
  })
  app.get('/sacraments/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const item = await prisma.sacrament.findUnique({ where: { slug }, include: { image: true } })
    if (!item || !item.active) throw new AppError(404, 'Sacramento não encontrado.')
    return reply.send(withImage(item))
  })
  app.put('/sacraments/:id', { preHandler: [authorize('SACRAMENTS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = z
      .object({
        name: z.string().optional(),
        summary: z.string().optional(),
        content: z.string().optional(),
        whatItIs: z.string().optional(),
        whoCanReceive: z.string().optional(),
        howItWorks: z.string().optional(),
        documents: z.array(z.string()).optional(),
        howToRegister: z.string().optional(),
        secretaryContact: z.string().optional(),
        imageId: z.string().nullable().optional(),
        active: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
      .parse(request.body)
    const item = await prisma.sacrament.update({ where: { id }, data, include: { image: true } })
    return reply.send(withImage(item))
  })

  // Pessoas
  app.get('/people', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const where: Prisma.PersonWhereInput = query.all === 'true' ? {} : { active: true }
    if (query.type) where.type = String(query.type) as PersonType
    const rows = await prisma.person.findMany({
      where,
      include: { photo: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return reply.send({ data: rows.map(withImage) })
  })
  app.get('/people/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const item = await prisma.person.findUnique({ where: { slug }, include: { photo: true } })
    if (!item || !item.active) throw new AppError(404, 'Pessoa não encontrada.')
    return reply.send(withImage(item))
  })
  app.post('/people', { preHandler: [authorize('PEOPLE_MANAGE')] }, async (request, reply) => {
    const data = z
      .object({
        name: z.string().min(2),
        slug: z.string().optional(),
        type: z.enum(['PADRE', 'DIACONO', 'COORDENADOR', 'PASTORAL_RESPONSAVEL']),
        roleTitle: z.string().min(2),
        bio: z.string().min(3),
        quote: z.string().optional().nullable(),
        ministry: z.string().optional().nullable(),
        attendance: z.string().optional().nullable(),
        photoId: z.string().optional().nullable(),
        featured: z.boolean().default(false),
        active: z.boolean().default(true),
        sortOrder: z.number().default(0),
      })
      .parse(request.body)
    const item = await prisma.person.create({
      data: { ...data, slug: data.slug ? slugify(data.slug) : slugify(data.name) },
      include: { photo: true },
    })
    return reply.status(201).send(withImage(item))
  })
  app.put('/people/:id', { preHandler: [authorize('PEOPLE_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = z
      .object({
        name: z.string().optional(),
        slug: z.string().optional(),
        type: z.enum(['PADRE', 'DIACONO', 'COORDENADOR', 'PASTORAL_RESPONSAVEL']).optional(),
        roleTitle: z.string().optional(),
        bio: z.string().optional(),
        quote: z.string().nullable().optional(),
        ministry: z.string().nullable().optional(),
        attendance: z.string().nullable().optional(),
        photoId: z.string().nullable().optional(),
        featured: z.boolean().optional(),
        active: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
      .parse(request.body)
    const item = await prisma.person.update({
      where: { id },
      data: { ...data, slug: data.slug ? slugify(data.slug) : data.name ? slugify(data.name) : undefined },
      include: { photo: true },
    })
    return reply.send(withImage(item))
  })
  app.delete('/people/:id', { preHandler: [authorize('PEOPLE_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.person.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // Galeria
  app.get('/gallery', async (request, reply) => {
    const query = request.query as Record<string, unknown>
    const { page, limit, skip } = parsePagination(query)
    const where: Prisma.GalleryItemWhereInput = { active: true }
    if (query.category) where.category = String(query.category) as GalleryCategory
    const [total, rows] = await Promise.all([
      prisma.galleryItem.count({ where }),
      prisma.galleryItem.findMany({
        where,
        include: { media: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ])
    return reply.send(
      paginated(
        rows.map((item) => ({
          ...item,
          src: item.media.url,
          thumb: item.media.thumbnailUrl ?? item.media.url,
        })),
        total,
        page,
        limit,
      ),
    )
  })
  app.post('/gallery', { preHandler: [authorize('GALLERY_MANAGE')] }, async (request, reply) => {
    const data = z
      .object({
        title: z.string().min(2),
        alt: z.string().min(2),
        category: z.enum([
          'MISSAS',
          'EVENTOS',
          'FESTA_PADROEIRA',
          'SEMANA_SANTA',
          'CATEQUESE',
          'JUVENTUDE',
          'PASTORAIS',
          'ACOES_SOCIAIS',
        ]),
        mediaId: z.string(),
        date: z.string().datetime().optional(),
        active: z.boolean().default(true),
      })
      .parse(request.body)
    const item = await prisma.galleryItem.create({
      data: { ...data, date: data.date ? new Date(data.date) : new Date() },
      include: { media: true },
    })
    return reply.status(201).send(item)
  })
  app.delete('/gallery/:id', { preHandler: [authorize('GALLERY_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.galleryItem.delete({ where: { id } })
    return reply.send({ ok: true })
  })

  // Orações e contato
  app.post('/prayers', async (request, reply) => {
    const data = z
      .object({
        name: z.string().min(2),
        email: z.string().email().optional().nullable(),
        request: z.string().min(5),
        anonymous: z.boolean().default(false),
      })
      .parse(request.body)
    const item = await prisma.prayerRequest.create({
      data: {
        name: data.anonymous ? 'Anônimo' : data.name,
        email: data.anonymous ? null : data.email ?? null,
        request: data.request,
        anonymous: data.anonymous,
      },
    })
    return reply.status(201).send({
      message: 'Seu pedido foi recebido. Que Deus abençoe você e sua família.',
      id: item.id,
    })
  })
  app.get('/prayers', { preHandler: [authorize('PRAYERS_MANAGE')] }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as Record<string, unknown>)
    const [total, data] = await Promise.all([
      prisma.prayerRequest.count(),
      prisma.prayerRequest.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ])
    return reply.send(paginated(data, total, page, limit))
  })
  app.patch('/prayers/:id', { preHandler: [authorize('PRAYERS_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = z.object({ status: z.enum(['NEW', 'PRAYED', 'ARCHIVED']) }).parse(request.body)
    return reply.send(await prisma.prayerRequest.update({ where: { id }, data }))
  })

  app.post('/contact', async (request, reply) => {
    const data = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional().nullable(),
        subject: z.string().min(2),
        message: z.string().min(5),
      })
      .parse(request.body)
    const item = await prisma.contactMessage.create({ data })
    return reply.status(201).send({ message: 'Mensagem enviada com sucesso.', id: item.id })
  })
  app.get('/messages', { preHandler: [authorize('MESSAGES_MANAGE')] }, async (request, reply) => {
    const { page, limit, skip } = parsePagination(request.query as Record<string, unknown>)
    const [total, data] = await Promise.all([
      prisma.contactMessage.count(),
      prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
    ])
    return reply.send(paginated(data, total, page, limit))
  })
  app.patch('/messages/:id', { preHandler: [authorize('MESSAGES_MANAGE')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = z.object({ status: z.enum(['NEW', 'READ', 'REPLIED']) }).parse(request.body)
    return reply.send(await prisma.contactMessage.update({ where: { id }, data }))
  })

  // Configurações
  app.get('/settings', async (_request, reply) => {
    const settings = await prisma.parishSettings.findUnique({ where: { id: 'default' } })
    return reply.send(settings)
  })
  app.put('/settings', { preHandler: [authorize('SETTINGS_MANAGE')] }, async (request, reply) => {
    const data = z.record(z.string(), z.any()).parse(request.body)
    const settings = await prisma.parishSettings.update({ where: { id: 'default' }, data })
    await logActivity({ userId: request.authUser!.id, action: 'update', entity: 'settings', entityId: 'default' })
    return reply.send(settings)
  })

  // Dashboard
  app.get('/dashboard', { preHandler: [authorize('DASHBOARD_VIEW')] }, async (_request, reply) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const [
      publishedNews,
      activeNotices,
      eventsThisMonth,
      masses,
      prayers,
      gallery,
      recentNews,
      upcomingEvents,
      activities,
      pastorals,
    ] = await Promise.all([
      prisma.news.count({ where: { status: 'PUBLISHED' } }),
      prisma.notice.count({
        where: {
          active: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
      }),
      prisma.event.count({ where: { startsAt: { gte: monthStart, lte: monthEnd }, active: true } }),
      prisma.massSchedule.count({ where: { active: true } }),
      prisma.prayerRequest.count({ where: { status: 'NEW' } }),
      prisma.galleryItem.count({ where: { active: true } }),
      prisma.news.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { category: true } }),
      prisma.event.findMany({
        where: { active: true, startsAt: { gte: now } },
        orderBy: { startsAt: 'asc' },
        take: 5,
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
      prisma.pastoral.count({ where: { active: true } }),
    ])
    return reply.send({
      cards: {
        publishedNews,
        activeNotices,
        eventsThisMonth,
        upcomingMasses: masses,
        prayerRequests: prayers,
        galleryPhotos: gallery,
        pastorals,
      },
      recentNews,
      upcomingEventsList: upcomingEvents,
      upcomingEvents: eventsThisMonth,
      activities,
      pastorals,
      publishedNews,
      activeNotices,
      prayerRequests: prayers,
      galleryPhotos: gallery,
      upcomingMasses: masses,
    })
  })

  app.get('/notifications', { preHandler: [authenticate()] }, async (_request, reply) => {
    const [activities, newPrayers, newMessages] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
      prisma.prayerRequest.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.contactMessage.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    const alerts = [
      ...newPrayers.map((item) => ({
        id: `prayer-${item.id}`,
        type: 'prayer' as const,
        title: item.anonymous ? 'Novo pedido de oração anônimo' : `Novo pedido de oração de ${item.name}`,
        createdAt: item.createdAt,
        href: '/admin/oracoes',
      })),
      ...newMessages.map((item) => ({
        id: `message-${item.id}`,
        type: 'message' as const,
        title: `Nova mensagem: ${item.subject}`,
        createdAt: item.createdAt,
        href: '/admin/mensagens',
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return reply.send({ data: { activities, alerts } })
  })

  // Perfis e permissões em users.routes.ts
}
