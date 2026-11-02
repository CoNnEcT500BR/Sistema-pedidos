import { useCallback, useEffect, useRef, useState } from 'react';
import type { Addon, Category, Combo, MenuItem } from '../types/menu.types';
import { menuService } from '../services/menu.service';
import { useI18n } from '@/i18n';

interface QueryState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useMenuQuery<T>(options: {
  fetcher: () => Promise<T>;
  initialData: T;
  errorMessage: string;
  enabled?: boolean;
  resetOnDisabled?: boolean;
  refreshIntervalMs?: number;
}): QueryState<T> {
  const {
    fetcher,
    initialData,
    errorMessage,
    enabled = true,
    resetOnDisabled = false,
    refreshIntervalMs,
  } = options;
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  // Use refs for values that shouldn't trigger re-fetch when they change identity
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const errorMessageRef = useRef(errorMessage);
  errorMessageRef.current = errorMessage;
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  const fetch = useCallback(async (background = false) => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      if (resetOnDisabled) {
        setData(initialDataRef.current);
      }
      return;
    }

    if (!background) setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch {
      setError(errorMessageRef.current);
      if (!background) setData(initialDataRef.current);
    } finally {
      if (!background) setLoading(false);
    }
  }, [enabled, resetOnDisabled]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  useEffect(() => {
    if (!enabled || !refreshIntervalMs) return;
    const intervalId = window.setInterval(() => {
      void fetch(true);
    }, refreshIntervalMs);
    return () => window.clearInterval(intervalId);
  }, [enabled, fetch, refreshIntervalMs]);

  return { data, loading, error, refetch: () => fetch() };
}

export function useCategories() {
  const { t } = useI18n();
  const query = useMenuQuery<Category[]>({
    fetcher: () => menuService.getCategories(),
    initialData: [],
    errorMessage: t('Não foi possível carregar as categorias.'),
  });

  return {
    categories: query.data,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useMenuItems(categoryId?: string) {
  const { t } = useI18n();
  const query = useMenuQuery<MenuItem[]>({
    fetcher: () => menuService.getMenuItems(categoryId),
    initialData: [],
    errorMessage: t('Não foi possível carregar os itens.'),
    refreshIntervalMs: 30_000,
  });

  return {
    items: query.data,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAddons(menuItemId: string | null) {
  const { t } = useI18n();
  const query = useMenuQuery<Addon[]>({
    fetcher: () => menuService.getAddons(menuItemId as string),
    initialData: [],
    errorMessage: t('Não foi possível carregar os adicionais.'),
    enabled: Boolean(menuItemId),
    resetOnDisabled: true,
  });

  return {
    addons: query.data,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useAllAddons() {
  const { t } = useI18n();
  const query = useMenuQuery<Addon[]>({
    fetcher: () => menuService.getAllAddons(),
    initialData: [],
    errorMessage: t('Não foi possível carregar os adicionais.'),
  });

  return {
    addons: query.data,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCombos() {
  const { t } = useI18n();
  const query = useMenuQuery<Combo[]>({
    fetcher: () => menuService.getCombos(),
    initialData: [],
    errorMessage: t('Nao foi possivel carregar os combos.'),
    refreshIntervalMs: 30_000,
  });

  return {
    combos: query.data,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}
