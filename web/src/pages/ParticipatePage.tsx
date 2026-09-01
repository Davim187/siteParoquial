import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { usePageMeta } from '@/hooks/usePageMeta'

export function ParticipatePage() {
  usePageMeta('Sou paroquiano | Paróquia Nossa Senhora das Graças')

  return (
    <div>
      <PageHeader
        eyebrow="Acolhida"
        title="Faça parte da nossa comunidade"
        description="Informações para novos paroquianos e para quem deseja participar mais de perto."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-14 md:px-6">
        <p className="leading-relaxed text-muted">
          Se você é novo na paróquia, seja muito bem-vindo. Comece conhecendo os horários das missas, os avisos e as
          pastorais. A secretaria poderá orientar sobre cadastro, dízimo e caminhos de participação.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>Participe das celebrações dominicais</li>
          <li>Conheça as pastorais e movimentos</li>
          <li>Entre em contato com a secretaria</li>
          <li>Envie intenções e pedidos de oração</li>
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button href="/pastorais">Conheça nossas pastorais</Button>
          <Button href="/contato" variant="outline">
            Falar com a secretaria
          </Button>
          <Button href="/oracao" variant="secondary">
            Pedido de oração
          </Button>
        </div>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  usePageMeta('Página não encontrada')
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-gold-dark">404</p>
      <h1 className="mt-2 font-serif text-4xl text-navy">Página não encontrada</h1>
      <p className="mt-3 text-muted">O endereço acessado não existe ou foi movido.</p>
      <Button href="/" className="mt-8">
        Voltar ao início
      </Button>
    </div>
  )
}
