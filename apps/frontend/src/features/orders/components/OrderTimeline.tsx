import {
  AlertCircle,
  CheckCircle,
  ChefHat,
  Circle,
  Clock,
  PackageCheck,
  XCircle,
} from 'lucide-react';
import type { OrderStatus, OrderStatusHistory } from '../types/order.types';

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusMeta: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> =
  {
    PENDING: { label: 'Aguardando', icon: Clock, color: 'text-yellow-500' },
    CONFIRMED: { label: 'Confirmado', icon: CheckCircle, color: 'text-blue-500' },
    PREPARING: { label: 'Preparando', icon: ChefHat, color: 'text-orange-500' },
    READY: { label: 'Pronto para Retirada', icon: PackageCheck, color: 'text-green-500' },
    COMPLETED: { label: 'Concluído', icon: CheckCircle, color: 'text-gray-400' },
    CANCELLED: { label: 'Cancelado', icon: XCircle, color: 'text-red-500' },
  };

interface OrderTimelineProps {
  history: OrderStatusHistory[];
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <AlertCircle size={16} />
        Sem histórico disponível.
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <ol className="relative border-l border-gray-200 space-y-4 ml-2">
      {sorted.map((entry, idx) => {
        const meta = statusMeta[entry.status as OrderStatus] ?? {
          label: entry.status,
          icon: Circle,
          color: 'text-gray-400',
        };
        const Icon = meta.icon;
        const isLast = idx === sorted.length - 1;

        return (
          <li key={entry.id} className="ml-5">
            <span
              className={`absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-white
                ${isLast ? 'ring-2 ring-primary-400' : ''}`}
            >
              <Icon size={16} className={meta.color} />
            </span>
            <div>
              <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
              {entry.reason && (
                <p className="text-xs text-gray-500 mt-0.5">{entry.reason}</p>
              )}
              <time className="text-xs text-gray-400">
                {formatDateTime(entry.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
