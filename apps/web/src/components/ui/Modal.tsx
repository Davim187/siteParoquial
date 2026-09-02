import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          className="fixed inset-0 bg-navy-deep/70 backdrop-blur-sm"
          aria-label="Fechar"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="relative z-10 my-4 flex w-full max-w-3xl max-h-[min(90vh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-4 md:px-6">
            {title ? (
              <h2 className="min-w-0 font-serif text-xl leading-snug text-navy break-words md:text-2xl">
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-muted hover:bg-cream"
              aria-label="Fechar janela"
            >
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
