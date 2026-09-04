import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { toPublicMediaPath } from '../../lib/media-url.js'
import { publicSettingsSelect } from './settings.schema.js'
import { decorateMasses } from '../masses/masses.helpers.js'
import { withImage } from './content.service.js'

const mediaLite = { select: { url: true, thumbnailUrl: true } } as const
const newsLiteSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  publishedAt: true,
  createdAt: true,
  featured: true,
  showProgress: true,
  progressMode: true,
  progressBadge: true,
  progressLabel: true,
  progressCurrent: true,
  progressGoal: true,
  coverMedia: mediaLite,
  category: { select: { name: true } },
  author: { select: { name: true } },
} satisfies Prisma.NewsSelect

function mapNewsLite(item: {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string
  publishedAt: Date | null
  createdAt: Date
  featured: boolean
  showProgress: boolean
  progressMode: string | null
  progressBadge: string | null
  progressLabel: string | null
  progressCurrent: number | null
  progressGoal: number | null
  coverMedia: { url: string; thumbnailUrl: string | null } | null
  category: { name: string } | null
  author: { name: string } | null
}) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle,
    excerpt: item.excerpt,
    content: '',
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
    featured: item.featured,
    status: 'PUBLISHED' as const,
    showProgress: item.showProgress,
    progressMode: item.progressMode,
    progressBadge: item.progressBadge,
    progressLabel: item.progressLabel,
    progressCurrent: item.progressCurrent,
    progressGoal: item.progressGoal,
    coverUrl: toPublicMediaPath(item.coverMedia?.url ?? null),
    coverThumbUrl: toPublicMediaPath(item.coverMedia?.thumbnailUrl ?? null),
    categoryName: item.category?.name ?? null,
    authorName: item.author?.name ?? null,
    gallery: [],
    galleryMediaIds: [],
  }
}

/** Um único payload para a home — reduz várias idas à API. */
export async function getHomeBootstrap() {
  const now = new Date()

  const [
    settings,
    campaign,
    notices,
    massRows,
    events,
    news,
    people,
    pastorals,
    albums,
  ] = await Promise.all([
    prisma.parishSettings.findUnique({
      where: { id: 'default' },
      select: publicSettingsSelect,
    }),
    prisma.news.findFirst({
      where: { showProgress: true, status: 'PUBLISHED' },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
      select: newsLiteSelect,
    }),
    prisma.notice.findMany({
      where: {
        active: true,
        featured: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: { image: mediaLite },
      orderBy: [{ priority: 'desc' }, { startsAt: 'desc' }],
      take: 6,
    }),
    prisma.massSchedule.findMany({
      where: { active: true },
      select: {
        id: true,
        weekday: true,
        date: true,
        time: true,
        type: true,
        location: true,
        notes: true,
        active: true,
      },
    }),
    prisma.event.findMany({
      where: { active: true, startsAt: { gte: now } },
      include: { image: mediaLite },
      orderBy: { startsAt: 'asc' },
      take: 6,
    }),
    prisma.news.findMany({
      where: { status: 'PUBLISHED' },
      select: newsLiteSelect,
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
      take: 8,
    }),
    prisma.person.findMany({
      where: { active: true },
      include: { photo: mediaLite },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 8,
    }),
    prisma.pastoral.findMany({
      where: { active: true },
      include: { image: mediaLite },
      orderBy: { name: 'asc' },
    }),
    prisma.galleryAlbum.findMany({
      where: { active: true },
      include: {
        coverMedia: mediaLite,
        _count: { select: { photos: true } },
      },
      orderBy: [{ eventDate: 'desc' }, { sortOrder: 'asc' }],
      take: 3,
    }),
  ])

  const masses = decorateMasses(massRows)
    .filter((item) => item.occursAt >= now)
    .slice(0, 4)

  const patroness = settings?.patroness as { image?: string } | null | undefined
  const settingsOut = settings
    ? {
        ...settings,
        patroness: patroness
          ? { ...patroness, image: toPublicMediaPath(patroness.image) ?? patroness.image ?? '' }
          : settings.patroness,
      }
    : settings

  return {
    settings: settingsOut,
    campaign: campaign ? mapNewsLite(campaign) : null,
    notices: notices.map((item) => ({
      ...item,
      imageUrl: toPublicMediaPath(item.image?.url ?? null),
      imageThumbUrl: toPublicMediaPath(item.image?.thumbnailUrl ?? null),
    })),
    masses,
    events: events.map((item) => ({
      ...item,
      imageUrl: toPublicMediaPath(item.image?.url ?? null),
      imageThumbUrl: toPublicMediaPath(item.image?.thumbnailUrl ?? null),
    })),
    news: news.map(mapNewsLite),
    people: people.map(withImage),
    pastorals: pastorals.map(withImage),
    gallery: albums.map((album) => ({
      id: album.id,
      title: album.title,
      slug: album.slug,
      description: album.description,
      coverMediaId: album.coverMediaId,
      coverUrl: toPublicMediaPath(album.coverMedia?.url ?? null),
      coverThumbUrl: toPublicMediaPath(
        album.coverMedia?.thumbnailUrl ?? album.coverMedia?.url ?? null,
      ),
      eventDate: album.eventDate,
      active: album.active,
      sortOrder: album.sortOrder,
      photoCount: album._count.photos,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
    })),
  }
}
