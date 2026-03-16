import { isAxiosError } from 'axios';
import { AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderCard } from '@/features/orders/components/OrderCard';
import { ordersService } from '@/features/orders/services/orders.service';
import type { Order, OrderStatus } from '@/features/orders/types/order.types';
import { useOrdersRealtimeRefresh } from '@/hooks/useOrdersRealtimeRefresh';
import { useI18n } from '@/i18n';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

interface Metrics {
  waiting: number;
  preparing: number;
  ready: number;
  total: number;
}

function calcMetrics(orders: Order[]): Metrics {
  return {
    waiting: orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length,
    preparing: orders.filter((o) => o.status === 'PREPARING').length,
    ready: orders.filter((o) => o.status === 'READY').length,
    total: orders.length,
  };
}

export function DashboardPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrders({ date: getTodayDate() });
      // Show only active orders on dashboard (exclude completed/cancelled)
      const active = data.filter(
        (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED',
      );
      setOrders(active);
    } catch (err) {
      if (!silent) {
        const message = isAxiosError(err)
          ? t(err.response?.data?.message ?? 'Erro ao carregar pedidos.')
          : t('Erro ao carregar pedidos.');
        setError(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useOrdersRealtimeRefresh(() => {
    void fetchOrders(true);
  });

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    try {
      await ordersService.updateOrderStatus(orderId, status);
      await fetchOrders(true);
    } catch {
      // silently fail; realtime update will re-sync
    } finally {
      setUpdatingId(null);
    }
  }

  const metrics = calcMetrics(orders);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('Pedidos de hoje · atualiza automaticamente')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              void fetchOrders();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600
              text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
            {t('Atualizar')}
          </button>
          <button
            onClick={() => navigate('/staff/orders/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600
              text-white text-sm font-semibold transition-colors"
          >
            <PlusCircle size={16} />
            {t('Novo Pedido')}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: t('Aguardando'), value: metrics.waiting, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: t('Preparando'), value: metrics.preparing, color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: t('Prontos'), value: metrics.ready, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: t('Total Hoje'), value: metrics.total, color: 'bg-gray-50 border-gray-200 text-gray-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={24} className="animate-spin mr-2" />
          {t('Carregando pedidos...')}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🎉</div>
          <p className="font-medium">{t('Nenhum pedido ativo no momento.')}</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('Pedidos Ativos')} ({orders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                isUpdating={updatingId === order.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
