import { useEffect, useRef, useState } from 'react'

export function useAsync<T>(loader: () => Promise<T>, deps: readonly unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const depsKey = JSON.stringify(deps)
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    void loaderRef.current()
      .then((result) => {
        if (active) {
          setData(result)
          setError(null)
        }
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as informações. Tente novamente.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [depsKey])

  return { data, loading, error, setData }
}
