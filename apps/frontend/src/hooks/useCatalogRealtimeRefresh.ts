import { useRealtimeRefresh } from './useRealtimeRefresh';

export function useCatalogRealtimeRefresh(onChange: () => void): void {
  useRealtimeRefresh('catalog', onChange);
}
