import { MapPin } from 'lucide-react'
import { Hero } from '@/components/home/Hero'
import { FeaturedNotice } from '@/components/home/FeaturedNotice'
import { QuickLinks } from '@/components/home/QuickLinks'
import { CampaignBanner } from '@/components/home/CampaignBanner'
import { DonateTeaser, JoinCommunity, SocialFollow } from '@/components/home/CommunityBlocks'
import { MassCard } from '@/components/events/MassCard'
import { EventCard } from '@/components/events/EventCard'
import { NewsCard } from '@/components/news/NewsCard'
import { PersonCard } from '@/components/people/PersonCard'
import { PastoralCard } from '@/components/pastorals/PastoralCard'
import { AlbumGrid } from '@/components/gallery/AlbumGrid'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { Button } from '@/components/ui/Button'
import { ErrorState, EmptyState, Skeleton } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import { useHomeQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { MapEmbed } from '@/components/ui/MapEmbed'

function CardSkeletonGrid({ count, className = 'h-48' }: { count: number; className?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}

export function HomePage() {
  usePageMeta(
    'Paróquia Nossa Senhora das Graças | Missas, Eventos e Notícias',
    'Portal oficial da Paróquia Nossa Senhora das Graças. Missas, avisos, notícias e vida em comunidade.',
  )

  const home = useHomeQuery()
  const data = home.data

  const campaignNews = data?.campaign ?? undefined
  const featuredNews = data?.news.find((article) => article.featured && article.id !== campaignNews?.id)
  const newsPreview = (data?.news ?? [])
    .filter((article) => article.id !== featuredNews?.id && article.id !== campaignNews?.id)
    .slice(0, 3)
  const pastoralsPreview = data?.pastorals.slice(0, 3) ?? []
  const galleryPreview = data?.gallery ?? []
  const masses = data?.masses ?? []
  const events = data?.events.slice(0, 3) ?? []
  const people = data?.people ?? []
  const showSkeletons = home.isLoading && !data

  if (home.isError && !data) {
    return (
      <ErrorState
        message={getErrorMessage(home.error, 'Não foi possível carregar as informações da paróquia.')}
      />
    )
  }

  return (
    <div className="animate-fade-in">
      {data?.settings ? (
        <Hero settings={data.settings} />
      ) : (
        <Skeleton className="min-h-[min(92vh,52rem)] rounded-none bg-navy-deep/80" />
      )}
      {campaignNews ? <CampaignBanner article={campaignNews} /> : null}

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle
            eyebrow="Liturgia"
            title="Próxima missa"
            description="A informação mais procurada, em destaque."
          />
          <Button href="/missas" variant="outline">
            Ver todos os horários
          </Button>
        </div>
        {showSkeletons ? (
          <CardSkeletonGrid count={4} className="h-36" />
        ) : masses.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {masses.map((mass) => (
              <MassCard key={mass.id} mass={mass} />
            ))}
          </div>
        ) : (
          <EmptyState title="Horários em atualização" description="Consulte a secretaria ou volte em breve." />
        )}
      </section>

      <FeaturedNotice notices={data?.notices} />
      <QuickLinks />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Agenda" title="Próximos eventos" />
            <Button href="/agenda" variant="outline">
              Ver agenda completa
            </Button>
          </div>
          {showSkeletons ? (
            <div className="grid gap-5 md:grid-cols-3">
              <Skeleton className="h-56" />
              <Skeleton className="h-56" />
              <Skeleton className="h-56" />
            </div>
          ) : events.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhum evento próximo" description="Acompanhe a agenda paroquial para novidades." />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow="Comunicação" title="Notícias da Paróquia" />
          <Button href="/noticias" variant="link">
            Ver todas as notícias →
          </Button>
        </div>
        {showSkeletons ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64 sm:col-span-2 lg:col-span-3" />
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
        ) : featuredNews || newsPreview.length ? (
          <div className="space-y-6">
            {featuredNews ? <NewsCard article={featuredNews} featured /> : null}
            {newsPreview.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {newsPreview.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptyState title="Sem notícias no momento" description="Novidades da paróquia aparecerão aqui." />
        )}
      </section>

      <JoinCommunity />

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <SectionTitle
          align="center"
          eyebrow="Pastores"
          title="Padre e Diácono"
          description="Informações oficiais serão publicadas pela paróquia."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {showSkeletons ? (
            <>
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </>
          ) : (
            people.map((person) => <PersonCard key={person.id} person={person} />)
          )}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Serviço" title="Pastorais" />
            <Button href="/pastorais" variant="outline">
              Ver todas
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {showSkeletons
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)
              : pastoralsPreview.map((pastoral) => (
                  <PastoralCard key={pastoral.id} pastoral={pastoral} />
                ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow="Memória" title="Galeria" />
          <Button href="/galeria" variant="outline">
            Ver galeria
          </Button>
        </div>
        {showSkeletons ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="aspect-[4/3]" />
            <Skeleton className="aspect-[4/3]" />
            <Skeleton className="aspect-[4/3]" />
          </div>
        ) : galleryPreview.length ? (
          <AlbumGrid albums={galleryPreview} />
        ) : (
          <EmptyState title="Galeria em construção" description="Em breve, fotos dos momentos da comunidade." />
        )}
      </section>

      {data?.settings ? <SocialFollow settings={data.settings} /> : null}
      <DonateTeaser />

      {data?.settings ? (
        <section className="bg-cream-dark py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:px-6">
            <div>
              <SectionTitle eyebrow="Contato" title="Como chegar" />
              <p className="mt-4 flex items-start gap-2 text-sm text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {data.settings.address}
              </p>
              <Button href="/contato" className="mt-6">
                Fale conosco
              </Button>
            </div>
            <MapEmbed
              mapsUrl={data.settings.mapsUrl}
              address={data.settings.address}
              className="aspect-[4/3] min-h-[280px]"
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}
