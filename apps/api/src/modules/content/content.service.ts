import { prisma } from '../../lib/prisma.js'
import { toPublicMediaPath } from '../../lib/media-url.js'

export function withImage<T extends Record<string, unknown>>(item: T) {
  const image = (item as { image?: { url?: string | null; thumbnailUrl?: string | null } }).image
  const photo = (item as { photo?: { url?: string | null; thumbnailUrl?: string | null } }).photo
  return {
    ...item,
    imageUrl: toPublicMediaPath(image?.url ?? photo?.url ?? null),
    imageThumbUrl: toPublicMediaPath(image?.thumbnailUrl ?? photo?.thumbnailUrl ?? null),
  }
}

export async function getDashboardStats() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [
    publishedNews,
    activeNotices,
    eventsThisMonth,
    masses,
    prayers,
    galleryPhotos,
    galleryAlbums,
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
    prisma.galleryPhoto.count({
      where: { album: { active: true } },
    }),
    prisma.galleryAlbum.count({ where: { active: true } }),
    prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        publishedAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.event.findMany({
      where: { active: true, startsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        startsAt: true,
        location: true,
        type: true,
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    prisma.pastoral.count({ where: { active: true } }),
  ])

  return {
    cards: {
      publishedNews,
      activeNotices,
      eventsThisMonth,
      upcomingMasses: masses,
      prayerRequests: prayers,
      galleryPhotos,
      galleryAlbums,
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
    galleryPhotos,
    galleryAlbums,
    upcomingMasses: masses,
  }
}

export async function getNotifications() {
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

  return { activities, alerts }
}
