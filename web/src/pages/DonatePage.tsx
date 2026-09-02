import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { useSettingsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'

export function DonatePage() {
  usePageMeta('Dízimo e doações | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = useSettingsQuery()

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
