import { isAxiosError } from 'axios';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { OrderCard } from '@/features/orders/components/OrderCard';
import { ordersService } from '@/features/orders/services/orders.service';
import type { Order, OrderStatus } from '@/features/orders/types/order.types';
import { useOrdersRealtimeRefresh } from '@/hooks/useOrdersRealtimeRefresh';
import { useI18n } from '@/i18n';

type FilterTab = 'ALL' | OrderStatus;

export function OrdersListPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrders();
      setOrders(data);
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

  const filtered =
    activeTab === 'ALL' ? orders : orders.filter((o) => o.status === activeTab);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: t('Todos') },
    { key: 'PENDING', label: t('Aguardando') },
    { key: 'CONFIRMED', label: t('Confirmados') },
    { key: 'PREPARING', label: t('Preparando') },
    { key: 'READY', label: t('Prontos') },
    { key: 'COMPLETED', label: t('Concluídos') },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('Pedidos')}</h1>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-xl">
        {tabs.map(({ key, label }) => {
          const count = key === 'ALL' ? orders.length : orders.filter((o) => o.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-semibold
                    ${activeTab === key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">{t('Nenhum pedido encontrado.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isUpdating={updatingId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
