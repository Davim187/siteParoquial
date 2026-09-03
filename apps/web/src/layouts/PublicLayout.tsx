import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { hydrateHomeFromSession, prefetchHome } from '@/services/homeService'
import { prefetchPublicRoute } from '@/lib/public-prefetch'

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

    const warm = () => {
      for (const route of WARM_ROUTES) prefetchPublicRoute(route)
    }

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }

    const timer = window.setTimeout(warm, 1200)
    return () => window.clearTimeout(timer)
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
