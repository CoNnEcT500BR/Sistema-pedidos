import { useEffect, useState } from 'react';

import { apiClient } from '@/services/api.service';
import { useAuthStore } from '@/features/auth/store/auth.store';

interface ApiResponse<T> {
  data: T;
}

export function useFeatureFlags(channel: 'ADMIN' | 'STAFF' | 'KIOSK' | 'API') {
  const { user } = useAuthStore();
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const role = user?.role ?? 'PUBLIC';
    const userKey = user?.id ?? 'anonymous';

    apiClient
      .get<ApiResponse<Record<string, boolean>>>('/api/feature-flags/evaluate', {
        params: {
          role,
          channel,
          userKey,
        },
      })
      .then((res) => setFlags(res.data.data))
      .catch(() => {
        setFlags({});
      });
  }, [channel, user?.id, user?.role]);

  function isEnabled(key: string, defaultValue = false): boolean {
    if (!(key in flags)) {
      return defaultValue;
    }

    return Boolean(flags[key]);
  }

  return {
    flags,
    isEnabled,
  };
}
