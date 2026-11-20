import { useState } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/cn'

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  return ok
}

export function ShareButtons({
  title,
  text,
  url,
  className,
}: {
  title: string
  text?: string
  url?: string
  className?: string
}) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')

  async function handleCopyLink() {
    const ok = await copyToClipboard(shareUrl)
    if (ok) {
      setCopied(true)
      toast.push('Link copiado!')
      window.setTimeout(() => setCopied(false), 2000)
    } else {
      toast.push('Não foi possível copiar o link.', 'error')
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }
    await handleCopyLink()
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-navy hover:border-gold"
        onClick={() => void handleShare()}
      >
        <Share2 size={16} /> Compartilhar
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm hover:border-gold"
        onClick={() => void handleCopyLink()}
      >
        {copied ? <Check size={14} /> : <Link2 size={14} />}
        {copied ? 'Link copiado' : 'Copiar link'}
      </button>
    </div>
  )
}
