import { FacebookIcon, InstagramIcon, YoutubeIcon } from '@/components/ui/SocialIcons'
import { Button } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/SectionTitle'
import type { ParishSettings } from '@/types'

export function SocialFollow({ settings }: { settings: ParishSettings }) {
  return (
    <section className="bg-beige/60 py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionTitle
          align="center"
          eyebrow="Comunicação"
          title="Acompanhe nossa comunidade"
          description="Fique por dentro de tudo o que acontece em nossa paróquia."
        />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" className="pointer-events-none" aria-disabled>
            <InstagramIcon size={18} /> Instagram: {settings.instagram}
          </Button>
          <Button variant="secondary" className="pointer-events-none" aria-disabled>
            <FacebookIcon size={18} /> Facebook: {settings.facebook}
          </Button>
          <Button variant="secondary" className="pointer-events-none" aria-disabled>
            <YoutubeIcon size={18} /> YouTube: {settings.youtube}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          Os links das redes sociais serão publicados quando a paróquia os informar.
        </p>
      </div>
    </section>
  )
}

export function JoinCommunity() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-marian" />
      <div className="relative mx-auto max-w-4xl px-4 text-center text-white md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Comunidade</p>
        <h2 className="mt-3 font-serif text-3xl md:text-4xl">Você também faz parte dessa família.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/80">
          Há um lugar para você na liturgia, na catequese, na juventude, no serviço e na oração. Venha caminhar conosco.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/pastorais" variant="gold">
            Conheça nossas pastorais
          </Button>
          <Button href="/participar" variant="ghost">
            Participe da comunidade
          </Button>
        </div>
      </div>
    </section>
  )
}

export function DonateTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="grid gap-6 rounded-3xl bg-navy p-8 text-white md:grid-cols-[1.4fr_1fr] md:p-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Partilha</p>
          <h2 className="mt-2 font-serif text-3xl">Ajude nossa comunidade</h2>
          <p className="mt-4 text-white/80">
            O dízimo e as doações sustentam a missão da paróquia: liturgia, catequese, caridade e cuidado com a casa de
            oração. Contribua de coração, conforme suas possibilidades.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 text-navy">
          <h3 className="font-serif text-2xl">Contribua com nossa paróquia</h3>
          <p className="mt-2 text-sm text-muted">PIX, QR Code e dados bancários serão publicados neste espaço.</p>
          <Button href="/dizimo" className="mt-5 w-full">
            Quero contribuir
          </Button>
        </div>
      </div>
    </section>
  )
}
