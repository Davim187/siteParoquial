export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-marian" />
      <span>{label}</span>
    </div>
  )
}

export function Skeleton({ className = 'h-40' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-beige ${className}`} aria-hidden="true" />
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <p className="font-serif text-xl text-navy">{title}</p>
      {description ? <p className="mt-2 text-muted">{description}</p> : null}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-800" role="alert">
      {message}
    </div>
  )
}
