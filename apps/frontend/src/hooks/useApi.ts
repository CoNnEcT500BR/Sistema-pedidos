import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

interface UseApiOptions<TData> {
  immediate?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: TData) => void;
}

export function useApi<T>(url: string, options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { immediate = true, onError, onSuccess } = options;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<T>(url);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onError, onSuccess, url]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
