import { useEffect, useRef } from 'react';
import { realtimeService } from '@/services/realtime.service';

type RealtimeChannel = 'catalog' | 'orders' | 'users';

function subscribeToChannel(channel: RealtimeChannel, onEvent: () => void): () => void {
  switch (channel) {
    case 'catalog':
      return realtimeService.subscribeToCatalog(() => onEvent());
    case 'orders':
      return realtimeService.subscribeToOrders(() => onEvent());
    case 'users':
      return realtimeService.subscribeToUsers(() => onEvent());
  }
}

export function useRealtimeRefresh(
  channel: RealtimeChannel,
  onChange: () => void,
  debounceMs = 250,
): void {
  const onChangeRef = useRef(onChange);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const unsubscribe = subscribeToChannel(channel, () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        onChangeRef.current();
      }, debounceMs);
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [channel, debounceMs]);
}
