import { Clock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Order, OrderStatus } from '../types/order.types';

function formatRelative(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} dias`;
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
  const navigate = useNavigate();
  const action = nextAction[order.status];
  const timeAgo = formatRelative(order.createdAt);
  const price = (order.finalPrice ?? order.totalPrice).toFixed(2).replace('.', ',');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xl font-bold text-gray-900">#{order.orderNumber}</span>
          {order.customerName && (
            <p className="text-sm text-gray-500 mt-0.5">{order.customerName}</p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {timeAgo}
        </span>
        <span className="font-semibold text-gray-700">R$ {price}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/staff/orders/${order.id}`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600
            text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Eye size={14} />
          Detalhes
        </button>

        {action && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <button
            onClick={() => onStatusChange(order.id, action.next)}
            disabled={isUpdating}
            className="flex-1 px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50
              disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {isUpdating ? '...' : action.label}
          </button>
        )}
      </div>
    </div>
  );
}
