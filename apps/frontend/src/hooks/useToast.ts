import { useCallback, useState } from 'react';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
  open: boolean;
}

interface ToastStore {
  toasts: ToastData[];
  toast: (opts: Omit<ToastData, 'id' | 'open'>) => void;
  dismiss: (id: string) => void;
}

export function useToast(): ToastStore {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((opts: Omit<ToastData, 'id' | 'open'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...opts, id, open: true }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
