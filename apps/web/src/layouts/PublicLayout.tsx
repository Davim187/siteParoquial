import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { queryClient } from '@/lib/query-client'
import { queryKeys } from '@/lib/query-keys'
import { STALE_TIME, GC_TIME } from '@/lib/query-client'
import { getCampaignNews } from '@/services/newsService'
import { getSettings } from '@/services/parishService'

export function PublicLayout() {
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.news.campaign,
      queryFn: getCampaignNews,
      staleTime: STALE_TIME.news,
      gcTime: GC_TIME.long,
    })
    void queryClient.prefetchQuery({
      queryKey: queryKeys.settings,
      queryFn: getSettings,
      staleTime: STALE_TIME.settings,
      gcTime: GC_TIME.long,
    })
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
