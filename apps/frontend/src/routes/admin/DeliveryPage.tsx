import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bike, Plus, Route, Send } from 'lucide-react';

import { deliveryService } from '@/features/delivery/services/delivery.service';
import type {
  DeliveryCourier,
  DeliveryRecord,
  DeliveryRoute,
  DeliveryStatus,
} from '@/features/delivery/types/delivery.types';
import { useI18n } from '@/i18n';

const statusLabels: Record<DeliveryStatus, string> = {
  QUEUED: 'Na fila',
  ASSIGNED: 'Atribuida',
  DISPATCHED: 'Despachada',
  IN_ROUTE: 'Em rota',
  DELIVERED: 'Entregue',
  FAILED: 'Falha',
};

const nextStatusOptions: DeliveryStatus[] = ['ASSIGNED', 'DISPATCHED', 'IN_ROUTE', 'DELIVERED', 'FAILED'];

export function DeliveryPage() {
  const { t } = useI18n();
  const [queue, setQueue] = useState<DeliveryRecord[]>([]);
  const [couriers, setCouriers] = useState<DeliveryCourier[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [courierName, setCourierName] = useState('');
  const [courierZone, setCourierZone] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeZone, setRouteZone] = useState('');

  const [assigningDeliveryId, setAssigningDeliveryId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [queueData, courierData, routeData] = await Promise.all([
        deliveryService.getQueue(),
        deliveryService.getCouriers(),
        deliveryService.getRoutes(),
      ]);
      setQueue(queueData);
      setCouriers(courierData);
      setRoutes(routeData);
    } catch {
      setError(t('Não foi possível carregar o painel de delivery.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const queueByStatus = useMemo(() => {
    return {
      queued: queue.filter((item) => item.status === 'QUEUED'),
      active: queue.filter((item) => item.status === 'ASSIGNED' || item.status === 'DISPATCHED' || item.status === 'IN_ROUTE'),
      done: queue.filter((item) => item.status === 'DELIVERED' || item.status === 'FAILED'),
    };
  }, [queue]);

  async function syncReadyOrders() {
    setError('');
    try {
      await deliveryService.syncReadyOrdersToQueue();
      await loadAll();
    } catch {
      setError(t('Não foi possível sincronizar pedidos prontos para delivery.'));
    }
  }

  async function createCourier() {
    if (!courierName.trim()) return;
    setError('');
    try {
      await deliveryService.createCourier({
        name: courierName.trim(),
        zone: courierZone.trim() || undefined,
      });
      setCourierName('');
      setCourierZone('');
      await loadAll();
    } catch {
      setError(t('Não foi possível criar entregador.'));
    }
  }

  async function createRoute() {
    if (!routeName.trim() || !routeZone.trim()) return;
    setError('');
    try {
      await deliveryService.createRoute({
        name: routeName.trim(),
        zone: routeZone.trim(),
      });
      setRouteName('');
      setRouteZone('');
      await loadAll();
    } catch {
      setError(t('Não foi possível criar rota.'));
    }
  }

  async function assignDelivery(deliveryId: string, courierId: string) {
    if (!courierId) return;
    setAssigningDeliveryId(deliveryId);
    setError('');
    try {
      const route = routes.find((entry) => {
        const courier = couriers.find((c) => c.id === courierId);
        if (!courier?.zone) {
          return false;
        }
        return entry.zone.toLowerCase() === courier.zone.toLowerCase();
      });

      await deliveryService.assignDelivery(deliveryId, {
        courierId,
        routeId: route?.id,
      });

      await loadAll();
    } catch {
      setError(t('Não foi possível atribuir entrega.'));
    } finally {
      setAssigningDeliveryId(null);
    }
  }

  async function updateStatus(deliveryId: string, status: DeliveryStatus) {
    setAssigningDeliveryId(deliveryId);
    setError('');
    try {
      await deliveryService.updateStatus(deliveryId, status);
      await loadAll();
    } catch {
      setError(t('Não foi possível atualizar status da entrega.'));
    } finally {
      setAssigningDeliveryId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">{t('Admin')}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{t('Delivery')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              {t('Gerencie fila de entregas, atribuições por entregador e roteirização por zona em tempo real.')}
            </p>
          </div>

          <button
            type="button"
            onClick={syncReadyOrders}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <Send size={16} />
            {t('Sincronizar pedidos prontos')}
          </button>
        </div>
      </div>

      {error ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900">{t('Fila de entregas')}</h2>
          <p className="mt-1 text-sm text-stone-500">{t('Pedidos prontos para sair e em rota')}</p>

          {loading ? (
            <p className="mt-4 text-sm text-stone-500">{t('Carregando delivery...')}</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{t('Na fila')}</p>
                <p className="mt-1 text-2xl font-black text-amber-900">{queueByStatus.queued.length}</p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">{t('Em andamento')}</p>
                <p className="mt-1 text-2xl font-black text-sky-900">{queueByStatus.active.length}</p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{t('Finalizadas')}</p>
                <p className="mt-1 text-2xl font-black text-emerald-900">{queueByStatus.done.length}</p>
              </div>
            </div>
          )}
        </article>

        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900">{t('Cadastro rápido')}</h2>
          <p className="mt-1 text-sm text-stone-500">{t('Crie entregadores e rotas por zona')}</p>

          <div className="mt-4 space-y-3 rounded-2xl border border-stone-200 p-4">
            <p className="text-sm font-semibold text-stone-900">{t('Novo entregador')}</p>
            <input
              value={courierName}
              onChange={(event) => setCourierName(event.target.value)}
              placeholder={t('Nome do entregador')}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              value={courierZone}
              onChange={(event) => setCourierZone(event.target.value)}
              placeholder={t('Zona (opcional)')}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={createCourier}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white"
            >
              <Plus size={14} />
              {t('Adicionar entregador')}
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-stone-200 p-4">
            <p className="text-sm font-semibold text-stone-900">{t('Nova rota')}</p>
            <input
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              placeholder={t('Nome da rota')}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              value={routeZone}
              onChange={(event) => setRouteZone(event.target.value)}
              placeholder={t('Zona da rota')}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={createRoute}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700"
            >
              <Route size={14} />
              {t('Adicionar rota')}
            </button>
          </div>
        </article>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900">{t('Painel operacional de entregas')}</h2>

        {loading ? (
          <p className="mt-4 text-sm text-stone-500">{t('Carregando delivery...')}</p>
        ) : queue.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            {t('Nenhuma entrega na fila. Sincronize pedidos prontos para iniciar a operação.')}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {queue.map((item) => (
              <article key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-bold text-stone-900">#{item.orderNumber}</p>
                    <p className="text-sm text-stone-600">{item.customerName || t('Cliente não identificado')}</p>
                    <p className="mt-1 text-xs text-stone-500">{t('Status')}: {t(statusLabels[item.status])}</p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        void assignDelivery(item.id, event.target.value);
                        event.target.value = '';
                      }}
                      disabled={assigningDeliveryId === item.id}
                      className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700"
                    >
                      <option value="">{t('Atribuir entregador')}</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name}{courier.zone ? ` (${courier.zone})` : ''}
                        </option>
                      ))}
                    </select>

                    <select
                      defaultValue=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        void updateStatus(item.id, event.target.value as DeliveryStatus);
                        event.target.value = '';
                      }}
                      disabled={assigningDeliveryId === item.id}
                      className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700"
                    >
                      <option value="">{t('Atualizar status')}</option>
                      {nextStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {t(statusLabels[status])}
                        </option>
                      ))}
                    </select>

                    <span className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
                      <Bike size={14} />
                      {item.courierId
                        ? couriers.find((courier) => courier.id === item.courierId)?.name ?? t('Atribuído')
                        : t('Sem entregador')}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
