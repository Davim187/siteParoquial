import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Loading, ErrorState } from '@/components/ui/Feedback'
import { useSettingsQuery } from '@/hooks/queries/usePublicQueries'
import { getErrorMessage } from '@/lib/api-error'
import { usePageMeta } from '@/hooks/usePageMeta'
import { submitContactMessage } from '@/services/contactService'
import { mapsEmbedSrc } from '@/utils/maps'

export function ContactPage() {
  usePageMeta('Contato | Paróquia Nossa Senhora das Graças')
  const { data, isLoading, error } = useSettingsQuery()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    await submitContactMessage({
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      subject: String(form.get('subject') ?? ''),
      message: String(form.get('message') ?? ''),
    })
    setSubmitting(false)
    setSent(true)
    event.currentTarget.reset()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Fale conosco"
        title="Contato"
        description="Estamos à disposição para acolher sua mensagem."
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-2 md:px-6">
        <div>
          {isLoading && !data ? <Loading /> : null}
          {error ? <ErrorState message={getErrorMessage(error)} /> : null}
          {data ? (
            <div className="space-y-3 rounded-2xl border border-line bg-white p-6 text-sm text-muted">
              <p><strong className="text-navy">Endereço:</strong> {data.address}</p>
              <p><strong className="text-navy">Telefone:</strong> {data.phone}</p>
              <p><strong className="text-navy">WhatsApp:</strong> {data.whatsapp}</p>
              <p><strong className="text-navy">E-mail:</strong> {data.email}</p>
              <p><strong className="text-navy">Instagram:</strong> {data.instagram}</p>
              <p><strong className="text-navy">Facebook:</strong> {data.facebook}</p>
              <p><strong className="text-navy">YouTube:</strong> {data.youtube}</p>
              <p><strong className="text-navy">Secretaria:</strong> {data.secretaryHours}</p>
              <div className="overflow-hidden rounded-xl pt-2">
                <iframe
                  title="Mapa"
                  className="h-56 w-full border-0"
                  loading="lazy"
                  src={mapsEmbedSrc(data.mapsUrl, data.address)}
                />  
              </div>
              <Button href={data.mapsUrl} variant="outline" className="mt-2">
                Como chegar
              </Button>
            </div>
          ) : null}
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="font-serif text-2xl text-navy">Envie uma mensagem</h2>
          {sent ? (
            <p className="rounded-xl bg-marian/10 p-4 text-sm text-marian" role="status">
              Mensagem enviada com sucesso. A secretaria responderá pelos canais oficiais.
            </p>
          ) : null}
          <Field label="Nome" name="name" required />
          <Field label="E-mail" name="email" type="email" required />
          <Field label="Telefone" name="phone" />
          <Field label="Assunto" name="subject" required />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-navy">Mensagem</span>
            <textarea
              name="message"
              required
              rows={5}
              className="w-full rounded-xl border border-line bg-cream px-3 py-2"
            />
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar mensagem'}
          </Button>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-navy">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-line bg-cream px-3 py-2"
      />
    </label>
  )
}
