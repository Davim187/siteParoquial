import { PageHeader } from '@/components/ui/PageHeader'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { usePageMeta } from '@/hooks/usePageMeta'
import { getSettings } from '@/services/parishService'
import { images } from '@/data/mocks'

export function ParishPage() {
  usePageMeta('Nossa Paróquia | Paróquia Nossa Senhora das Graças')
  const { data, loading, error } = useAsync(() => getSettings(), [])

  if (loading) return <Loading />
  if (error || !data) return <ErrorState message={error ?? 'Erro ao carregar'} />

  return (
    <div>
      <PageHeader
        eyebrow="Institucional"
        title="Nossa Paróquia"
        description="Conheça a história, a missão e a padroeira desta comunidade de fé."
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 md:px-6">
        <section>
          <SectionTitle title="Nossa história" />
          <p className="mt-5 max-w-3xl leading-relaxed text-muted">{data.history}</p>
        </section>
        <section id="missao" className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6">
            <SectionTitle title="Nossa missão" />
            <p className="mt-4 leading-relaxed text-muted">{data.mission}</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6">
            <SectionTitle title="Nossa visão" />
            <p className="mt-4 leading-relaxed text-muted">{data.vision}</p>
          </div>
        </section>
        <section id="padroeira" className="grid items-center gap-8 lg:grid-cols-2">
          <img
            src={data.patroness.image || images.mary}
            alt="Imagem de Nossa Senhora das Graças — demonstrativa"
            className="h-full max-h-[520px] w-full rounded-3xl object-cover shadow-lg"
            loading="lazy"
          />
          <div>
            <SectionTitle eyebrow="Padroeira" title={data.patroness.name} />
            <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted md:text-base">
              <div>
                <h3 className="font-serif text-xl text-navy">História</h3>
                <p className="mt-2">{data.patroness.history}</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-navy">Devoção</h3>
                <p className="mt-2">{data.patroness.devotion}</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-navy">Medalha milagrosa</h3>
                <p className="mt-2">{data.patroness.medal}</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-navy">Festa da padroeira</h3>
                <p className="mt-2">{data.patroness.feast}</p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-navy">Tradições</h3>
                <p className="mt-2">{data.patroness.traditions}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
