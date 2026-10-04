import * as dashboardRepository from './dashboard.repository.js'

export async function getDashboard() {
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
  ] = await dashboardRepository.loadDashboard()

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
  const [activities, newPrayers, newMessages] = await dashboardRepository.loadNotifications()

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

  return { data: { activities, alerts } }
}
