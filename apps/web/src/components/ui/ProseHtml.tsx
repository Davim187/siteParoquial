import { cn } from '@/utils/cn'
import { toDisplayHtml } from '@/utils/html'

export function ProseHtml({
  html,
  className,
  compact = false,
}: {
  html: string
  className?: string
  compact?: boolean
}) {
  const content = toDisplayHtml(html)
  if (!content) return null

  return (
    <div
      className={cn(
        compact
          ? 'text-sm leading-relaxed text-muted'
          : 'space-y-4 text-[15px] leading-relaxed text-ink',
        '[&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-navy',
        '[&_h3]:mt-6 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-navy',
        compact
          ? '[&_p]:m-0 [&_p]:whitespace-pre-wrap [&_p]:leading-relaxed [&_p+p]:mt-2'
          : '[&_p]:whitespace-pre-wrap [&_p]:leading-relaxed [&_p]:text-muted',
        '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted',
        '[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-muted',
        '[&_li]:leading-relaxed',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-gold [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-navy/80',
        '[&_a]:font-semibold [&_a]:text-marian [&_a]:underline',
        '[&_strong]:font-semibold [&_strong]:text-navy',
        '[&_em]:italic',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
