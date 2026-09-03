import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { prefetchPublicRoute } from '@/lib/public-prefetch'

const links = [
  { to: '/', label: 'Início' },
  { to: '/nossa-paroquia', label: 'Nossa Paróquia' },
  { to: '/noticias', label: 'Notícias' },
  { to: '/avisos', label: 'Avisos' },
  { to: '/missas', label: 'Missas' },
  { to: '/agenda', label: 'Eventos' },
  { to: '/pastorais', label: 'Pastorais' },
  { to: '/sacramentos', label: 'Sacramentos' },
  { to: '/galeria', label: 'Galeria' },
  { to: '/contato', label: 'Contato' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const mobileMenu =
    open &&
    createPortal(
      <div
        id="menu-mobile"
        className="xl:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-navy-deep/50"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
        <nav
          aria-label="Mobile"
          className="fixed inset-y-0 right-0 z-[110] flex w-[min(100vw-2.5rem,20rem)] flex-col bg-cream shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line/80 px-4 py-3">
            <p className="font-serif text-lg text-navy">Menu</p>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-navy"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => prefetchPublicRoute(link.to)}
                  onFocus={() => prefetchPublicRoute(link.to)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-3 text-base text-navy transition hover:bg-white',
                      isActive && 'bg-white font-semibold text-marian shadow-sm',
                    )
                  }
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-line/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <NavLink
              to="/participar"
              onClick={() => setOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-lg bg-marian px-5 py-3 text-sm font-medium text-white transition hover:bg-marian-light"
            >
              Sou paroquiano
            </NavLink>
          </div>
        </nav>
      </div>,
      document.body,
    )

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/95 backdrop-blur-md">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
        >
          Ir para o conteúdo
        </a>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="min-w-0 shrink">
            <Logo compact />
          </div>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Principal">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onMouseEnter={() => prefetchPublicRoute(link.to)}
                onFocus={() => prefetchPublicRoute(link.to)}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-2.5 py-1.5 text-[13px] font-medium text-navy/80 transition hover:text-marian',
                    isActive && 'bg-white text-marian shadow-sm',
                  )
                }
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden sm:inline-flex">
              <Button href="/participar" size="sm">
                Sou paroquiano
              </Button>
            </span>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white/70 text-navy transition hover:bg-white xl:hidden"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
      {mobileMenu}
    </>
  )
}
