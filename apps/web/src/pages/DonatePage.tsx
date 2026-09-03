import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useCampaignNewsQuery, useSettingsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function DonatePage() {
  usePageMeta('Dízimo e doações | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = useSettingsQuery()
  const campaignQuery = useCampaignNewsQuery()
  const campaign = campaignQuery.data ?? undefined

  return (
    <div>
      <PageHeader
        eyebrow="Partilha"
        title="Dízimo e doações"
        description="Sua contribuição sustenta a missão evangelizadora e o cuidado com a casa de Deus."
      />
      <div className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        {isLoading && !data ? <Loading /> : null}
        {error ? <ErrorState message={getErrorMessage(error)} /> : null}
        {data ? (
          <div className="space-y-6">
            <p className="leading-relaxed text-muted">
              O dízimo é expressão de gratidão e corresponsabilidade. As doações espontâneas também apoiam ações sociais,
              manutenção do templo e a pastoral da comunidade.
            </p>
            {campaign ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-dark">Obra da paróquia</p>
                  <h2 className="mt-1 font-serif text-xl text-navy">{campaign.title}</h2>
                  <div className="mt-3">
                    <ProgressBar
                      current={campaign.progressCurrent}
                      goal={campaign.progressGoal}
                      label={campaign.progressLabel || 'Arrecadação para o novo Centro Pastoral'}
                    />
                  </div>
                </div>
                <Button href={`/noticias/${campaign.slug}`} variant="outline" size="sm" className="shrink-0">
                  Acompanhar a obra
                </Button>
              </div>
            ) : null}
            <div className="rounded-2xl border border-gold/40 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-2xl text-navy">Contribua com nossa paróquia</h2>
              <dl className="mt-4 space-y-3 text-sm text-muted">
                <div>
                  <dt className="font-semibold text-navy">PIX</dt>
                  <dd>{data.pixKey}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy">Dados bancários</dt>
                  <dd>{data.bankDetails}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-navy">QR Code</dt>
                  <dd>[QR CODE — A DEFINIR]</dd>
                </div>
              </dl>
              <Button className="mt-6" href="/contato">
                Quero contribuir
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
