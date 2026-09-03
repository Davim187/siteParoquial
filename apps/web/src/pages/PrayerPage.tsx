import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { submitPrayerRequest } from '@/services/prayerService'

export function PrayerPage() {
  usePageMeta('Pedido de oração | Paróquia Nossa Senhora das Graças')
  const [sent, setSent] = useState(false)
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitError(null)
    setSubmitting(true)
    try {
      await submitPrayerRequest({
        name: String(form.get('name') ?? ''),
        email: String(form.get('email') ?? '') || undefined,
        request: String(form.get('request') ?? ''),
        anonymous,
      })
      setSent(true)
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Não foi possível enviar o pedido. Tente novamente.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Oração"
        title="Pedido de oração"
        description="Compartilhe conosco sua intenção. Nossa comunidade unirá a voz em oração."
      />
      <div className="mx-auto max-w-xl px-4 py-14 md:px-6">
        {sent ? (
          <div className="rounded-2xl border border-gold/40 bg-white p-8 text-center shadow-sm" role="status">
            <p className="font-serif text-2xl text-navy">
              Seu pedido foi recebido. Que Deus abençoe você e sua família.
            </p>
            <Button className="mt-6" onClick={() => setSent(false)}>
              Enviar outro pedido
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-white p-6">
            {submitError ? (
              <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">
                {submitError}
              </p>
            ) : null}
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy">Nome</span>
              <input
                name="name"
                required={!anonymous}
                disabled={anonymous}
                className="w-full rounded-xl border border-line bg-cream px-3 py-2 disabled:opacity-60"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy">E-mail (opcional)</span>
              <input
                name="email"
                type="email"
                disabled={anonymous}
                className="w-full rounded-xl border border-line bg-cream px-3 py-2 disabled:opacity-60"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-navy">Pedido de oração</span>
              <textarea name="request" required rows={5} className="w-full rounded-xl border border-line bg-cream px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              Desejo permanecer anônimo
            </label>
            <label className="flex items-start gap-2 text-sm text-muted">
              <input type="checkbox" required className="mt-1" />
              Aceito que este pedido seja acolhido pastoralmente pela equipe da paróquia.
            </label>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Enviando...' : 'Enviar pedido'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
