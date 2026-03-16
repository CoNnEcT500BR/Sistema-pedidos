import { useCallback, useEffect, useMemo, useState } from 'react';

import { StatusBadge } from '@/features/orders/components/StatusBadge';
import { ordersService } from '@/features/orders/services/orders.service';
import type { Order, OrderStatus } from '@/features/orders/types/order.types';
import { useOrdersRealtimeRefresh } from '@/hooks/useOrdersRealtimeRefresh';
import { useI18n } from '@/i18n';

const boardStatuses: Array<{ key: 'PENDING' | 'PREPARING' | 'READY'; label: string }> = [
  { key: 'PENDING', label: 'Aguardando' },
  { key: 'PREPARING', label: 'Preparando' },
  { key: 'READY', label: 'Pronto' },
];

export function OrdersBoardPage() {
  const { t, language } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    [language],
  );

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const data = await ordersService.getOrders();
      setOrders(data);
    } catch {
      setError(t('Não foi possível carregar os pedidos para o quadro de produção.'));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useOrdersRealtimeRefresh(() => {
    void loadOrders(true);
  });

  const groupedOrders = useMemo(() => {
    return {
      PENDING: orders.filter((order) => order.status === 'PENDING' || order.status === 'CONFIRMED'),
      PREPARING: orders.filter((order) => order.status === 'PREPARING'),
      READY: orders.filter((order) => order.status === 'READY'),
    };
  }, [orders]);

  async function runOrderTransition(order: Order, steps: OrderStatus[]) {
    setUpdatingOrderId(order.id);
    try {
      for (const step of steps) {
        await ordersService.updateOrderStatus(order.id, step);
      }
      await loadOrders(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('Não foi possível atualizar o status do pedido.');
      setError(message);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function moveOrder(order: Order, status: OrderStatus) {
    if (status === 'PREPARING' && order.status === 'PENDING') {
      await runOrderTransition(order, ['CONFIRMED', 'PREPARING']);
      return;
    }

    await runOrderTransition(order, [status]);
  }

  async function moveByDrop(order: Order, targetColumn: 'PENDING' | 'PREPARING' | 'READY') {
    if (targetColumn === 'PENDING') return;

    if (targetColumn === 'PREPARING') {
      if (order.status === 'PENDING') {
        await runOrderTransition(order, ['CONFIRMED', 'PREPARING']);
      } else if (order.status === 'CONFIRMED') {
        await runOrderTransition(order, ['PREPARING']);
      }
      return;
    }

    if (targetColumn === 'READY') {
      if (order.status === 'PENDING') {
        await runOrderTransition(order, ['CONFIRMED', 'PREPARING', 'READY']);
      } else if (order.status === 'CONFIRMED') {
        await runOrderTransition(order, ['PREPARING', 'READY']);
      } else if (order.status === 'PREPARING') {
        await runOrderTransition(order, ['READY']);
      }
      return;
    }
  }

  function getOrderById(id: string | null) {
    if (!id) return null;
    return orders.find((order) => order.id === id) ?? null;
  }

  async function handleDrop(targetColumn: 'PENDING' | 'PREPARING' | 'READY') {
    const order = getOrderById(draggingOrderId);
    setDraggingOrderId(null);

    if (!order) return;

    try {
      await moveByDrop(order, targetColumn);
    } catch {
      setError(t('Não foi possível atualizar o status do pedido.'));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Pedidos em produção')}</h1>
          <p className="mt-2 text-sm text-stone-600">{t('Acompanhe as etapas de aguardo, preparo e pronto com atualização rápida de status.')}</p>
        </div>

      </div>

      {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-500">
          {t('Carregando pedidos do quadro...')}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {boardStatuses.map((column) => {
            const columnOrders = groupedOrders[column.key];
            return (
              <section
                key={column.key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(column.key)}
                className="rounded-[1.75rem] border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-stone-900">{t(column.label)}</h2>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnOrders.length ? (
                    columnOrders.map((order) => (
                      <article
                        key={order.id}
                        draggable
                        onDragStart={() => setDraggingOrderId(order.id)}
                        onDragEnd={() => setDraggingOrderId(null)}
                        className="cursor-grab rounded-2xl border border-stone-200 bg-stone-50 p-4 active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-bold text-stone-900">#{order.orderNumber}</p>
                            <p className="text-sm text-stone-500">{order.customerName || t('Cliente não identificado')}</p>
                          </div>
                          <StatusBadge status={order.status} size="sm" />
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                          <span>{new Date(order.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'pt-BR')}</span>
                          <strong className="text-sm text-stone-900">{currency.format(order.finalPrice ?? order.totalPrice)}</strong>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                            <button
                              type="button"
                              onClick={() => moveOrder(order, 'PREPARING')}
                              disabled={updatingOrderId === order.id}
                              className="rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                            >
                              {order.status === 'PENDING' ? t('Confirmar e iniciar preparo') : t('Iniciar preparo')}
                            </button>
                          )}

                          {order.status === 'PREPARING' && (
                            <button
                              type="button"
                              onClick={() => moveOrder(order, 'READY')}
                              disabled={updatingOrderId === order.id}
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {t('Marcar como pronto')}
                            </button>
                          )}

                          {order.status === 'READY' && (
                            <button
                              type="button"
                              onClick={() => moveOrder(order, 'COMPLETED')}
                              disabled={updatingOrderId === order.id}
                              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-60"
                            >
                              {t('Concluir pedido')}
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                      {t('Nenhum pedido nesta etapa no momento.')}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
