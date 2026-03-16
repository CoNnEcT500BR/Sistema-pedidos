import { useEffect, useState } from 'react';
import { realtimeService, type RealtimeConnectionStatus } from '@/services/realtime.service';

export function useRealtimeConnectionStatus(): RealtimeConnectionStatus {
  const [status, setStatus] = useState<RealtimeConnectionStatus>(
    realtimeService.getConnectionStatus(),
  );

  useEffect(() => realtimeService.subscribeConnectionStatus(setStatus), []);

  return status;
}
