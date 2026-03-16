import { useEffect, useRef } from 'react';
import { realtimeService } from '@/services/realtime.service';

export function useUsersRealtimeRefresh(onChange: () => void): void {
  const onChangeRef = useRef(onChange);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToUsers(() => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = window.setTimeout(() => {
        onChangeRef.current();
      }, 250);
    });

    return () => {
      unsubscribe();
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
}
