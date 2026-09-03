import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { hydrateHomeFromSession, prefetchHome } from '@/services/homeService'
import { prefetchPublicRoute } from '@/lib/public-prefetch'
import { scheduleIdleTasks } from '@/lib/idle-prefetch'

const WARM_ROUTES = [
  '/noticias',
  '/avisos',
  '/missas',
  '/agenda',
  '/pastorais',
  '/sacramentos',
  '/galeria',
  '/nossa-paroquia',
]

export function PublicLayout() {
  useEffect(() => {
    hydrateHomeFromSession()
    void prefetchHome()

    return scheduleIdleTasks(WARM_ROUTES.map((route) => () => prefetchPublicRoute(route)))
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
