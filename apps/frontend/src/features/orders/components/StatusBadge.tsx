import type { OrderStatus } from '../types/order.types';
import { useI18n } from '@/i18n';

const statusConfig: Record<OrderStatus, { key: string; className: string }> = {
  PENDING: {
    key: 'Aguardando',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  CONFIRMED: {
    key: 'Confirmado',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  PREPARING: {
    key: 'Preparando',
    className: 'bg-orange-100 text-orange-800 border border-orange-200',
  },
  READY: {
    key: 'Pronto',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  COMPLETED: {
    key: 'Concluído',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  },
  CANCELLED: {
    key: 'Cancelado',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useI18n();
  const { key, className } = statusConfig[status] ?? {
    key: status,
    className: 'bg-gray-100 text-gray-600',
  };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${className}`}>
      {t(key)}
    </span>
  );
}
