import { MassCard } from '@/components/events/MassCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorState, EmptyState, SkeletonGrid } from '@/components/ui/Feedback'
import { Button } from '@/components/ui/Button'
import { useMassesQuery, useSettingsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function MassesPage() {
  usePageMeta(
    'Missas | Paróquia Nossa Senhora das Graças',
    'Horários das missas e celebrações eucarísticas da Paróquia Nossa Senhora das Graças.',
  )
  const month = new Date().toISOString().slice(0, 7)
  const masses = useMassesQuery({ month, limit: 50 })
  const settings = useSettingsQuery()
  const showSkeleton = masses.isLoading && !masses.data

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
        {masses.error && !masses.data ? (
          <ErrorState message={getErrorMessage(masses.error)} />
        ) : null}
        {showSkeleton ? <SkeletonGrid count={6} className="h-36" /> : null}
        {!showSkeleton && !masses.error && masses.data?.length === 0 ? (
          <EmptyState
            title="Nenhuma missa agendada"
            description="Os horários de missa serão publicados em breve."
          />
        ) : null}
        {masses.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {masses.data.map((mass) => (
              <MassCard key={mass.id} mass={mass} />
            ))}
          </div>
        ) : null}
        <div className="mt-10 text-center">
          <Button href="/agenda" variant="outline">
            Ver agenda paroquial completa
          </Button>
        </div>
      </div>
    </div>
  )
}
