import { MassCard } from '@/components/events/MassCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { useMassesQuery, useSettingsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function MassesPage() {
  usePageMeta('Missas | Paróquia Nossa Senhora das Graças')
  const month = new Date().toISOString().slice(0, 7)
  const masses = useMassesQuery({ month, limit: 50 })
  const settings = useSettingsQuery()

  return (
    <div>
      <PageHeader
        eyebrow="Liturgia"
        title="Agenda de missas"
        description="Confira os horários das celebrações eucarísticas da paróquia."
      >
        {settings.data?.streamingUrl ? (
          <p className="mt-4 text-sm text-white/70">Transmissão: {settings.data.streamingUrl}</p>
        ) : null}
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        {masses.isLoading && !masses.data ? <Loading /> : null}
        {masses.error ? <ErrorState message={getErrorMessage(masses.error)} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {masses.data?.map((mass) => (
            <MassCard key={mass.id} mass={mass} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/agenda" variant="outline">
            Ver agenda paroquial completa
          </Button>
        </div>
      </div>
    </div>
  )
}
