import { prisma } from '../../../lib/prisma.js'

export function loadDashboard() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return Promise.all([
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
    prisma.galleryAlbum.count({ where: { active: true } }),
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
}

export function loadNotifications() {
  return Promise.all([
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
}
