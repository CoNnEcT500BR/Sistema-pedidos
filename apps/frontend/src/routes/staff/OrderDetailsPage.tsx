import { isAxiosError } from 'axios';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '@/features/orders/components/StatusBadge';
import { OrderTimeline } from '@/features/orders/components/OrderTimeline';
import { ordersService } from '@/features/orders/services/orders.service';
import type { OrderDetail, OrderStatus } from '@/features/orders/types/order.types';
import { useI18n } from '@/i18n';

const nextAction: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  PENDING: { label: 'Confirmar Pedido', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Iniciar Preparo', next: 'PREPARING' },
  PREPARING: { label: 'Marcar como Pronto', next: 'READY' },
  READY: { label: 'Finalizar Pedido', next: 'COMPLETED' },
};

function parseRemovedIngredients(value: string | null | undefined): string[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.some((ingredient) => typeof ingredient !== 'string')) {
    throw new Error('Dados de remoção de ingredientes inválidos no pedido.');
  }
  return parsed;
}

function getPaymentMethodLabel(method: string | undefined, t: (text: string) => string): string {
  switch (method) {
    case 'CASH_ON_DELIVERY':
      return t('Dinheiro na entrega');
    case 'CARD_ON_DELIVERY':
      return t('Cartão na entrega');
    case 'PIX_ON_DELIVERY':
      return t('Pix na entrega');
    default:
      return t('Pagamento no balcão');
  }
}

export function OrderDetailsPage() {
  const { language, t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [focusCompletedStatus, setFocusCompletedStatus] = useState(false);
  const completedStatusRef = useRef<HTMLParagraphElement>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      const message = isAxiosError(err)
        ? t(err.response?.data?.message ?? 'Erro ao carregar pedido.')
        : t('Erro ao carregar pedido.');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (focusCompletedStatus && order?.status === 'COMPLETED') {
      completedStatusRef.current?.focus();
    }
  }, [focusCompletedStatus, order?.status]);

  async function handleStatusChange(status: OrderStatus) {
    if (!id) return;
    setUpdating(true);
    try {
      const updated = await ordersService.updateOrderStatus(id, status);
      setOrder(updated);
      if (updated.status === 'COMPLETED') {
        setFocusCompletedStatus(true);
      }
    } catch (err) {
      const message = isAxiosError(err)
        ? t(err.response?.data?.message ?? 'Não foi possível atualizar o status.')
        : t('Não foi possível atualizar o status.');
      setError(message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-600">
        <RefreshCw size={24} className="animate-spin mr-2" />
        {t('Carregando pedido...')}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle size={18} />
          {error ?? t('Pedido não encontrado.')}
        </div>
      </div>
    );
  }

  const action = nextAction[order.status];
  const price = (order.finalPrice ?? order.totalPrice).toFixed(2).replace('.', ',');
  const createdAt = new Date(order.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR');

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        {t('Voltar')}
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('Pedido')} #{order.orderNumber}</h1>
            <p className="text-gray-600 text-sm mt-1">{createdAt}</p>
            {order.customerName && (
              <p className="text-gray-700 font-medium mt-2">👤 {order.customerName}</p>
            )}
            {order.customerPhone && (
              <a className="mt-0.5 block text-sm text-blue-800 underline" href={`tel:${order.customerPhone}`}>
                {order.customerPhone}
              </a>
            )}
            <p className="mt-2 text-sm font-semibold text-gray-800">
              {order.fulfillmentType === 'DELIVERY' ? t('Entrega própria') : t('Retirada no local')}
            </p>
            {order.fulfillmentType === 'DELIVERY' && (
              <div className="mt-1 space-y-1 text-sm text-gray-700">
                <p>
                  {order.deliveryAddress}
                  {order.deliveryComplement ? ` · ${order.deliveryComplement}` : ''}
                  {order.deliveryZoneName ? ` · ${order.deliveryZoneName}` : ''}
                </p>
                {order.deliveryReference && <p>{t('Referência')}: {order.deliveryReference}</p>}
                <p>{t('Taxa de entrega')}: R$ {(order.deliveryFee ?? 0).toFixed(2).replace('.', ',')}</p>
                <p>{t('Pagamento')}: {getPaymentMethodLabel(order.paymentMethod, t)}</p>
                {order.cashChangeFor && (
                  <p>{t('Troco para')}: R$ {order.cashChangeFor.toFixed(2).replace('.', ',')}</p>
                )}
              </div>
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
                {t('Desconto')}: -R$ {order.discount.toFixed(2).replace('.', ',')}
              </p>
            ) : null}
          </div>
        </div>

        {action && order.fulfillmentType === 'DELIVERY' && action.next === 'COMPLETED' ? (
          <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900">
            {t('Finalize este pedido pelo painel de entregas após confirmar a entrega ao cliente.')}
          </p>
        ) : order.status === 'COMPLETED' ? (
          <p
            ref={completedStatusRef}
            tabIndex={-1}
            role="status"
            className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:ring-offset-2"
          >
            {t('Pedido #{number} concluído.', { number: order.orderNumber })}
          </p>
        ) : action ? (
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
                  {t('Atualizando...')}
                </>
              ) : (
                t(action.label)
              )}
            </button>
          </div>
        ) : null}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('Itens do Pedido')}</h2>
        <ul className="divide-y divide-gray-100">
          {order.items.map((item) => {
            const itemName = item.menuItem?.name ?? item.combo?.name ?? t('Item');
            const itemPrice = item.subtotal.toFixed(2).replace('.', ',');
            const removedIngredients = parseRemovedIngredients(item.removedIngredientsJson);
            return (
              <li key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {item.quantity}× {t(itemName)}
                    </span>
                    {item.notes && (
                      <p className="text-xs text-gray-600 mt-0.5 italic">{item.notes}</p>
                    )}
                    {removedIngredients.length > 0 && (
                      <div className="mt-1 rounded-lg bg-red-50 px-2 py-1.5">
                        <p className="text-xs font-semibold text-red-800">{t('Sem')}</p>
                        <ul className="mt-0.5">
                          {removedIngredients.map((ingredient, index) => (
                            <li key={`${ingredient}-${index}`} className="text-xs text-red-800">
                              {t(ingredient)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.addons.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {item.addons.map((a) => (
                          <li key={a.id} className="text-xs text-gray-500">
                            + {a.quantity}× {t(a.addon?.name ?? a.addonId)}
                            {a.addonPrice > 0 && (
                              <span className="text-gray-600 ml-1">
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
          <span className="text-lg font-bold text-gray-900">{t('Total')}: R$ {price}</span>
        </div>
      </div>

      {/* Timeline */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('Histórico de Status')}</h2>
          <OrderTimeline history={order.statusHistory} />
        </div>
      )}
    </div>
  );
}
