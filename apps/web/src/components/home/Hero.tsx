import { Button } from '@/components/ui/Button'
import { heroImage } from '@/data/mocks'
import type { ParishSettings } from '@/types'

export function Hero({ settings }: { settings: ParishSettings }) {
  return (
    <section className="relative min-h-[min(92vh,52rem)] overflow-hidden text-white">
      <img
        src={heroImage}
        alt="Interior de uma igreja católica, imagem demonstrativa da paróquia"
        className="absolute inset-0 h-full w-full scale-105 object-cover"
      />
      <div className="absolute inset-0 bg-navy-deep/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/80 via-navy-deep/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cream to-transparent opacity-90" />

      <div className="relative mx-auto flex min-h-[min(92vh,52rem)] max-w-6xl flex-col justify-center px-4 py-24 md:px-6">
        <div className="max-w-2xl animate-fade-in">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-gold/80" />
            <p className="text-[11px] font-semibold tracking-[0.28em] text-gold uppercase">
              Comunidade de fé
            </p>
          </div>
          <h1 className="font-serif text-4xl leading-[1.1] font-semibold sm:text-5xl md:text-6xl">
            {settings.name}
          </h1>
          <p className="mt-5 max-w-lg font-serif text-2xl leading-snug text-gold/95 italic md:text-[1.7rem]">
            Uma comunidade de fé, esperança e amor.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
            {settings.welcomeText}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="/nossa-paroquia" variant="gold" size="lg">
              Conheça nossa paróquia
            </Button>
            <Button href="/missas" variant="ghost" size="lg">
              Horários das missas
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
