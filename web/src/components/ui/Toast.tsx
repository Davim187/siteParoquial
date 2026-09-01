import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/utils/cn'

type ToastTone = 'success' | 'error' | 'info'
type ToastItem = { id: string; title: string; tone: ToastTone }

type ToastContextValue = {
  push: (title: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((title: string, tone: ToastTone = 'success') => {
    const id = crypto.randomUUID()
    setItems((current) => [...current, { id, title, tone }])
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(100%,22rem)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-up',
              item.tone === 'success' && 'border-emerald-200 bg-white text-emerald-900',
              item.tone === 'error' && 'border-red-200 bg-white text-red-900',
              item.tone === 'info' && 'border-line bg-white text-navy',
            )}
            role="status"
          >
            {item.tone === 'error' ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}
            <p className="flex-1 text-sm font-medium">{item.title}</p>
            <button
              type="button"
              className="text-muted"
              aria-label="Fechar"
              onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
