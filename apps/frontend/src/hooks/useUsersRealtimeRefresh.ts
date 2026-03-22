import { useRealtimeRefresh } from './useRealtimeRefresh';

export function useUsersRealtimeRefresh(onChange: () => void): void {
  useRealtimeRefresh('users', onChange);
}
