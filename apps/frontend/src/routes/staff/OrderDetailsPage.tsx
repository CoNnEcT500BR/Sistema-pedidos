import { isAxiosError } from 'axios';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '@/features/orders/components/StatusBadge';
import { OrderTimeline } from '@/features/orders/components/OrderTimeline';
import { ordersService } from '@/features/orders/services/orders.service';
import type { OrderDetail, OrderStatus } from '@/features/orders/types/order.types';

const nextAction: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  PENDING: { label: 'Confirmar Pedido', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Iniciar Preparo', next: 'PREPARING' },
  PREPARING: { label: 'Marcar como Pronto', next: 'READY' },
  READY: { label: 'Finalizar Pedido', next: 'COMPLETED' },
};

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? 'Erro ao carregar pedido.'
        : 'Erro ao carregar pedido.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleStatusChange(status: OrderStatus) {
    if (!id) return;
    setUpdating(true);
    try {
      const updated = await ordersService.updateOrderStatus(id, status);
      setOrder(updated);
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? 'Não foi possível atualizar o status.'
        : 'Não foi possível atualizar o status.';
      setError(message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <RefreshCw size={24} className="animate-spin mr-2" />
        Carregando pedido...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} />
          {error ?? 'Pedido não encontrado.'}
        </div>
      </div>
    );
  }

  const action = nextAction[order.status];
  const price = (order.finalPrice ?? order.totalPrice).toFixed(2).replace('.', ',');
  const createdAt = new Date(order.createdAt).toLocaleString('pt-BR');

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pedido #{order.orderNumber}</h1>
            <p className="text-gray-400 text-sm mt-1">{createdAt}</p>
            {order.customerName && (
              <p className="text-gray-700 font-medium mt-2">👤 {order.customerName}</p>
            )}
            {order.customerPhone && (
              <p className="text-gray-500 text-sm mt-0.5">📞 {order.customerPhone}</p>
            )}
            {order.notes && (
              <p className="text-gray-500 text-sm mt-2 italic">"{order.notes}"</p>
            )}
          </div>
          <div className="text-right">
            <StatusBadge status={order.status} />
            <p className="text-2xl font-bold text-gray-900 mt-3">R$ {price}</p>
            {order.discount ? (
              <p className="text-sm text-green-600 font-medium">
                Desconto: -R$ {order.discount.toFixed(2).replace('.', ',')}
              </p>
            ) : null}
          </div>
        </div>

        {action && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={() => handleStatusChange(action.next)}
              disabled={updating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                text-white font-semibold text-base transition-colors"
            >
              {updating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Atualizando...
                </>
              ) : (
                action.label
              )}
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Itens do Pedido</h2>
        <ul className="divide-y divide-gray-100">
          {order.items.map((item) => {
            const itemName = item.menuItem?.name ?? item.combo?.name ?? `Item`;
            const itemPrice = item.subtotal.toFixed(2).replace('.', ',');
            return (
              <li key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.quantity}× {itemName}
                    </span>
                    {item.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">{item.notes}</p>
                    )}
                    {item.addons.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.addons.map((a) => (
                          <li key={a.id} className="text-xs text-gray-500">
                            + {a.quantity}× {a.addon?.name ?? a.addonId}
                            {a.addonPrice > 0 && (
                              <span className="text-gray-400 ml-1">
                                (R$ {(a.addonPrice * a.quantity).toFixed(2).replace('.', ',')})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className="text-gray-700 font-semibold whitespace-nowrap">
                    R$ {itemPrice}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="pt-3 border-t border-gray-200 flex justify-end">
          <span className="text-lg font-bold text-gray-900">Total: R$ {price}</span>
        </div>
      </div>

      {/* Timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Histórico de Status</h2>
          <OrderTimeline history={order.statusHistory} />
        </div>
      )}
    </div>
  );
}
