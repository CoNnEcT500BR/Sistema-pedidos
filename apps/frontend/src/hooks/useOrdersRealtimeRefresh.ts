import { useRealtimeRefresh } from './useRealtimeRefresh';

export function useOrdersRealtimeRefresh(onChange: () => void): void {
  useRealtimeRefresh('orders', onChange);
}
