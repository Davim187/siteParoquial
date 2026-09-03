import { useEffect } from 'react'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let meta = document.querySelector(selector)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attr, key)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

/** Atualiza title, description e Open Graph básicos da página. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    const descMeta = document.querySelector('meta[name="description"]')
    const previousDescription = descMeta?.getAttribute('content') ?? ''

    upsertMeta('name', 'description', description ?? previousDescription)
    upsertMeta('property', 'og:title', title)
    if (description) upsertMeta('property', 'og:description', description)

    return () => {
      document.title = previousTitle
      if (description && descMeta) descMeta.setAttribute('content', previousDescription)
    }
  }, [title, description])
}
