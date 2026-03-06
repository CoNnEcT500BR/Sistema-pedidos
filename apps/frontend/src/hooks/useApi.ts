import { useState, useEffect } from 'react'
import { api } from '../services/api'

interface UseApiOptions {
  immediate?: boolean
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
}

export function useApi<T>(
  url: string,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { immediate = true, onError, onSuccess } = options

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.get(url)
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (immediate) {
      fetch()
    }
  }, [url, immediate])

  return { data, loading, error, refetch: fetch }
}
