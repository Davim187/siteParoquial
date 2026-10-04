import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/Feedback'

const RichTextEditor = lazy(() =>
  import('@/components/admin/RichTextEditor').then((mod) => ({ default: mod.RichTextEditor })),
)

export function LazyRichTextEditor({
  value,
  onChange,
  placeholder,
  compact,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  compact?: boolean
}) {
  return (
    <Suspense fallback={<Skeleton className={compact ? 'h-28' : 'h-48'} />}>
      <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} compact={compact} />
    </Suspense>
  )
}
