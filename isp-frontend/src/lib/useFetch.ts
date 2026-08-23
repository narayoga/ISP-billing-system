import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'

type State<T> = {
  data: T | null
  error: string | null
  loading: boolean
  reload: () => void
  setData: (v: T | null) => void
}

/**
 * Hook fetch ringan (plain fetch + hooks, sesuai pola scaffold).
 * Beri `path = null` untuk menunda fetch (mis. menunggu parameter siap).
 */
export function useFetch<T>(path: string | null): State<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(path != null)

  const reload = useCallback(() => {
    if (path == null) return
    setLoading(true)
    setError(null)
    api<T>(path)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'request_failed'))
      .finally(() => setLoading(false))
  }, [path])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload, setData }
}
