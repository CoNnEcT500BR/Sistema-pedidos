import { Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Order, OrderStatus } from '../types/order.types';
import { useI18n } from '@/i18n';

function formatRelative(dateStr: string, language: 'pt' | 'en', t: (text: string, vars?: Record<string, string | number>) => string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return t('agora mesmo');

  const formatter = new Intl.RelativeTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
    numeric: 'always',
  });

  if (diff < 3600) return formatter.format(-Math.floor(diff / 60), 'minute');
  if (diff < 86400) return formatter.format(-Math.floor(diff / 3600), 'hour');
  return formatter.format(-Math.floor(diff / 86400), 'day');
}
import { StatusBadge } from './StatusBadge';

const nextAction: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  PENDING: { label: 'Confirmar', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Preparar', next: 'PREPARING' },
  PREPARING: { label: 'Marcar Pronto', next: 'READY' },
  READY: { label: 'Finalizar', next: 'COMPLETED' },
};

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isUpdating?: boolean;
}

export function OrderCard({ order, onStatusChange, isUpdating }: OrderCardProps) {
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const action = nextAction[order.status];
  const canProgressFromCard =
    action &&
    !(order.fulfillmentType === 'DELIVERY' && action.next === 'COMPLETED');
  const timeAgo = formatRelative(order.createdAt, language, t);
  const price = (order.finalPrice ?? order.totalPrice).toFixed(2).replace('.', ',');

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xl font-bold text-gray-900">#{order.orderNumber}</span>
          {order.customerName && (
            <p className="text-sm text-gray-500 mt-0.5">{order.customerName}</p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {timeAgo}
        </span>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-900">
          {order.fulfillmentType === 'DELIVERY' ? t('Delivery') : t('Retirada')}
        </span>
        <span className="font-semibold text-gray-700">R$ {price}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => navigate(`/staff/orders/${order.id}`)}
          className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-gray-700
            text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Eye size={14} />
          {t('Detalhes')}
        </button>

        {action && canProgressFromCard && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <button
            onClick={() => onStatusChange(order.id, action.next)}
            disabled={isUpdating}
            className="touch-target flex-1 rounded-lg bg-primary-600 px-3 py-2 hover:bg-primary-700 disabled:opacity-50
              disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {isUpdating ? '...' : t(action.label)}
          </button>
        )}
      </div>
    </div>
  );
}
