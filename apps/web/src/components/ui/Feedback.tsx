export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 md:px-6" role="status" aria-label="Carregando página">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

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

export function SkeletonGrid({
  count = 6,
  className = 'h-48',
  cols = 'sm:grid-cols-2 lg:grid-cols-3',
}: {
  count?: number
  className?: string
  cols?: string
}) {
  return (
    <div className={`grid gap-5 ${cols}`} role="status" aria-label="Carregando">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      role="status"
      aria-label="Carregando"
    >
      <div className="grid gap-0">
        <div
          className="grid gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="mx-auto h-3 w-16 animate-pulse rounded bg-slate-200" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid gap-3 border-t border-slate-50 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }, (_, col) => (
              <div
                key={col}
                className="mx-auto h-3 w-full max-w-[8rem] animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
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
