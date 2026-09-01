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
import { Gallery } from '@/components/gallery/Gallery'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { Button } from '@/components/ui/Button'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { listUpcomingMasses } from '@/services/massesService'
import { getFeaturedNotices } from '@/services/noticesService'
import { listNews } from '@/services/newsService'
import { getSettings, listPeople } from '@/services/parishService'
import { listUpcomingEvents } from '@/services/eventsService'
import { listPastorals } from '@/services/pastoralService'
import { listGallery } from '@/services/galleryService'
import { mapsEmbedSrc } from '@/utils/maps'

export function HomePage() {
  usePageMeta(
    'Paróquia Nossa Senhora das Graças | Missas, Eventos e Notícias',
    'Portal oficial da Paróquia Nossa Senhora das Graças. Missas, avisos, notícias e vida em comunidade.',
  )

  const settings = useAsync(() => getSettings(), [])
  const notices = useAsync(() => getFeaturedNotices(), [])
  const masses = useAsync(() => listUpcomingMasses(4), [])
  const events = useAsync(() => listUpcomingEvents(3), [])
  const news = useAsync(() => listNews().then((items) => items.slice(0, 3)), [])
  const people = useAsync(() => listPeople(), [])
  const pastorals = useAsync(() => listPastorals().then((items) => items.slice(0, 3)), [])
  const gallery = useAsync(() => listGallery().then((items) => items.slice(0, 8)), [])

  if (settings.loading || !settings.data) {
    return settings.error ? <ErrorState message={settings.error} /> : <Loading />
  }

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
        {masses.loading ? (
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
          {events.loading ? (
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
        {news.loading ? (
          <Loading />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {news.data?.map((article) => (
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
            {pastorals.data?.map((pastoral) => (
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
        {gallery.data ? <Gallery items={gallery.data} /> : null}
      </section>

      <SocialFollow settings={settings.data} />
      <DonateTeaser />

      <section className="bg-cream-dark py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:px-6">
          <div>
            <SectionTitle eyebrow="Contato" title="Como chegar" />
            <p className="mt-4 inline-flex items-start gap-2 text-muted">
              <MapPin className="mt-1 shrink-0 text-gold-dark" size={18} />
              {settings.data.address}
            </p>
            <p className="mt-3 text-sm text-muted">Telefone: {settings.data.phone}</p>
            <p className="text-sm text-muted">WhatsApp: {settings.data.whatsapp}</p>
            <Button href="/contato" className="mt-6">
              Fale conosco
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-beige">
            <iframe
              title="Mapa da paróquia"
              src={mapsEmbedSrc(settings.data.mapsUrl, settings.data.address)}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
