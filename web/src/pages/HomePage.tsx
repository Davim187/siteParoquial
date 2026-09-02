import { MapPin } from 'lucide-react'
import { Hero } from '@/components/home/Hero'
import { FeaturedNotice } from '@/components/home/FeaturedNotice'
import { QuickLinks } from '@/components/home/QuickLinks'
import { DonateTeaser, JoinCommunity, SocialFollow } from '@/components/home/CommunityBlocks'
import { MassCard } from '@/components/events/MassCard'
import { EventCard } from '@/components/events/EventCard'
import { NewsCard } from '@/components/news/NewsCard'
import { PersonCard } from '@/components/people/PersonCard'
import { PastoralCard } from '@/components/pastorals/PastoralCard'
import { AlbumGrid } from '@/components/gallery/AlbumGrid'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { Button } from '@/components/ui/Button'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { usePageMeta } from '@/hooks/usePageMeta'
import {
  useFeaturedNoticesQuery,
  useNewsQuery,
  usePastoralsQuery,
  usePeopleQuery,
  useSettingsQuery,
  useUpcomingEventsQuery,
  useUpcomingMassesQuery,
} from '@/hooks/queries/usePublicQueries'
import { useGalleryAlbumsQuery } from '@/hooks/queries/useGalleryQueries'
import { getErrorMessage } from '@/lib/api-error'
import { mapsEmbedSrc } from '@/utils/maps'

export function HomePage() {
  usePageMeta(
    'Paróquia Nossa Senhora das Graças | Missas, Eventos e Notícias',
    'Portal oficial da Paróquia Nossa Senhora das Graças. Missas, avisos, notícias e vida em comunidade.',
  )

  const settings = useSettingsQuery()
  const notices = useFeaturedNoticesQuery()
  const masses = useUpcomingMassesQuery(4)
  const events = useUpcomingEventsQuery(3)
  const news = useNewsQuery()
  const people = usePeopleQuery()
  const pastorals = usePastoralsQuery()
  const gallery = useGalleryAlbumsQuery({ limit: 3 })

  if (settings.isLoading && !settings.data) {
    return <Loading />
  }

  if (settings.isError || !settings.data) {
    return <ErrorState message={getErrorMessage(settings.error, 'Não foi possível carregar as informações da paróquia.')} />
  }

  const newsPreview = news.data?.slice(0, 3) ?? []
  const pastoralsPreview = pastorals.data?.slice(0, 3) ?? []
  const galleryPreview = gallery.data?.data ?? []

  return (
    <div className="animate-fade-in">
      <Hero settings={settings.data} />

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
        {masses.isLoading && !masses.data ? (
          <Loading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {masses.data?.map((mass) => (
              <MassCard key={mass.id} mass={mass} />
            ))}
          </div>
        )}
      </section>

      <FeaturedNotice notices={notices.data ?? undefined} />
      <QuickLinks />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle eyebrow="Agenda" title="Próximos eventos" />
            <Button href="/agenda" variant="outline">
              Ver agenda completa
            </Button>
          </div>
          {events.isLoading && !events.data ? (
            <Loading />
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {events.data?.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
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
        {news.isLoading && !newsPreview.length ? (
          <Loading />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {newsPreview.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
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
          {people.data?.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
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
            {pastoralsPreview.map((pastoral) => (
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
        {galleryPreview.length ? <AlbumGrid albums={galleryPreview} /> : null}
      </section>

      <SocialFollow settings={settings.data} />
      <DonateTeaser />

      <section className="bg-cream-dark py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:px-6">
          <div>
            <SectionTitle eyebrow="Contato" title="Como chegar" />
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {settings.data.address}
            </p>
            <Button href="/contato" className="mt-6">
              Fale conosco
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line shadow-sm">
            <iframe
              title="Mapa da paróquia"
              src={mapsEmbedSrc(settings.data.mapsUrl, settings.data.address)}
              className="aspect-[4/3] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
