import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bike, MapPin, Plus, Route, Send } from 'lucide-react';

import { deliveryService } from '@/features/delivery/services/delivery.service';
import { useOrdersRealtimeRefresh } from '@/hooks/useOrdersRealtimeRefresh';
import type {
  DeliveryCourier,
  DeliveryRecord,
  DeliveryRoute,
  DeliveryStatus,
  DeliveryZone,
} from '@/features/delivery/types/delivery.types';
import { useI18n } from '@/i18n';

const statusLabels: Record<DeliveryStatus, string> = {
  QUEUED: 'Na fila',
  ASSIGNED: 'Atribuida',
  DISPATCHED: 'Despachada',
  IN_ROUTE: 'Em rota',
  DELIVERED: 'Entregue',
  FAILED: 'Falha',
  CANCELLED: 'Cancelada',
};

const nextStatusOptions: Record<DeliveryStatus, DeliveryStatus[]> = {
  QUEUED: ['ASSIGNED'],
  ASSIGNED: ['DISPATCHED', 'QUEUED'],
  DISPATCHED: ['IN_ROUTE', 'FAILED'],
  IN_ROUTE: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['ASSIGNED', 'QUEUED'],
  CANCELLED: [],
};

const paymentLabels: Record<string, string> = {
  AT_COUNTER: 'Pagamento no balcão',
  CASH_ON_DELIVERY: 'Dinheiro na entrega',
  CARD_ON_DELIVERY: 'Cartão na entrega',
  PIX_ON_DELIVERY: 'Pix na entrega',
};

const orderStatusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparo',
  READY: 'Pronto',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

function getNextStatusOptions(item: DeliveryRecord): DeliveryStatus[] {
  return nextStatusOptions[item.status].filter(
    (status) =>
      item.orderStatus === 'READY' ||
      !['DISPATCHED', 'IN_ROUTE', 'DELIVERED'].includes(status),
  );
}

export function DeliveryPage() {
  const { t } = useI18n();
  const [queue, setQueue] = useState<DeliveryRecord[]>([]);
  const [couriers, setCouriers] = useState<DeliveryCourier[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [zoneCreateFieldError, setZoneCreateFieldError] = useState<'name' | 'fee' | 'estimate' | null>(null);
  const [zoneCreateErrorMessage, setZoneCreateErrorMessage] = useState('');

  const [courierName, setCourierName] = useState('');
  const [courierZone, setCourierZone] = useState('');
  const [routeName, setRouteName] = useState('');
  const [routeZone, setRouteZone] = useState('');
  const courierNameInputRef = useRef<HTMLInputElement>(null);
  const routeNameInputRef = useRef<HTMLInputElement>(null);
  const routeZoneInputRef = useRef<HTMLInputElement>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState('');
  const [zoneEstimate, setZoneEstimate] = useState('45');
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneName, setEditZoneName] = useState('');
  const [editZoneFee, setEditZoneFee] = useState('');
  const [editZoneEstimate, setEditZoneEstimate] = useState('');
  const [zoneEditFieldError, setZoneEditFieldError] = useState<'name' | 'fee' | 'estimate' | null>(null);
  const [zoneEditErrorMessage, setZoneEditErrorMessage] = useState('');
  const zoneEditorNameRef = useRef<HTMLInputElement>(null);
  const zoneEditorFeeRef = useRef<HTMLInputElement>(null);
  const zoneEditorEstimateRef = useRef<HTMLInputElement>(null);
  const zoneNameInputRef = useRef<HTMLInputElement>(null);
  const zoneFeeInputRef = useRef<HTMLInputElement>(null);
  const zoneEstimateInputRef = useRef<HTMLInputElement>(null);
  const zoneEditButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousEditingZoneId = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const queueRef = useRef<DeliveryRecord[]>([]);

  const [assigningDeliveryId, setAssigningDeliveryId] = useState<string | null>(null);

  const loadAll = useCallback(async (silent = false): Promise<DeliveryRecord[] | null> => {
    const initialLoad = !hasLoadedRef.current;
    if (initialLoad) {
      setLoading(true);
      setStatusMessage(t('Carregando painel de delivery...'));
    }
    if (!silent) setError('');
    try {
      const [queueData, courierData, routeData, zoneData] = await Promise.all([
        deliveryService.getQueue(),
        deliveryService.getCouriers(),
        deliveryService.getRoutes(),
        deliveryService.getAdminZones(),
      ]);
      const previousQueue = new Map(queueRef.current.map((item) => [item.id, item]));
      const changedItems = queueData.filter((item) => {
        const previous = previousQueue.get(item.id);
        return (
          !previous ||
          previous.status !== item.status ||
          previous.orderStatus !== item.orderStatus
        );
      });
      queueRef.current = queueData;
      setQueue(queueData);
      setCouriers(courierData);
      setRoutes(routeData);
      setZones(zoneData);
      if (silent && changedItems.length > 0) {
        const message =
          changedItems.length === 1
            ? t('Pedido #{number} atualizado. Entrega: {deliveryStatus}; preparo: {orderStatus}.', {
                number: changedItems[0].orderNumber,
                deliveryStatus: t(statusLabels[changedItems[0].status]),
                orderStatus: t(orderStatusLabels[changedItems[0].orderStatus] ?? changedItems[0].orderStatus),
              })
            : t('{count} pedidos foram atualizados na fila de entregas.', {
                count: changedItems.length,
              });
        setStatusMessage(message);
      }
      return queueData;
    } catch {
      setError(
        silent
          ? t('Não foi possível atualizar a fila de delivery.')
          : t('Não foi possível carregar o painel de delivery.'),
      );
      return null;
    } finally {
      hasLoadedRef.current = true;
      if (initialLoad) {
        setLoading(false);
        setStatusMessage('');
      }
    }
  }, [t]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useOrdersRealtimeRefresh(() => {
    void loadAll(true);
  });

  useEffect(() => {
    if (editingZoneId) {
      zoneEditorNameRef.current?.focus();
    } else if (previousEditingZoneId.current) {
      zoneEditButtonRefs.current.get(previousEditingZoneId.current)?.focus();
    }
    previousEditingZoneId.current = editingZoneId;
  }, [editingZoneId]);

  const queueByStatus = useMemo(() => {
    return {
      queued: queue.filter((item) => item.status === 'QUEUED'),
      active: queue.filter((item) => item.status === 'ASSIGNED' || item.status === 'DISPATCHED' || item.status === 'IN_ROUTE'),
      done: queue.filter(
        (item) =>
          item.status === 'DELIVERED' ||
          item.status === 'FAILED' ||
          item.status === 'CANCELLED',
      ),
    };
  }, [queue]);

  async function syncReadyOrders() {
    setError('');
    setStatusMessage('');
    try {
      await deliveryService.syncReadyOrdersToQueue();
      if ((await loadAll()) === null) return;
      setStatusMessage(t('Fila de delivery atualizada.'));
    } catch {
      setError(t('Não foi possível sincronizar pedidos prontos para delivery.'));
    }
  }

  async function createCourier() {
    setError('');
    setStatusMessage('');
    if (!courierName.trim()) {
      setError(t('Informe o nome do entregador.'));
      courierNameInputRef.current?.focus();
      return;
    }
    try {
      await deliveryService.createCourier({
        name: courierName.trim(),
        zone: courierZone.trim() || undefined,
      });
      setCourierName('');
      setCourierZone('');
      if ((await loadAll()) === null) return;
      setStatusMessage(t('Entregador cadastrado.'));
    } catch {
      setError(t('Não foi possível criar entregador.'));
    }
  }

  async function createRoute() {
    setError('');
    setStatusMessage('');
    if (!routeName.trim()) {
      setError(t('Informe o nome da rota.'));
      routeNameInputRef.current?.focus();
      return;
    }
    if (!routeZone.trim()) {
      setError(t('Informe a zona da rota.'));
      routeZoneInputRef.current?.focus();
      return;
    }
    try {
      await deliveryService.createRoute({
        name: routeName.trim(),
        zone: routeZone.trim(),
      });
      setRouteName('');
      setRouteZone('');
      if ((await loadAll()) === null) return;
      setStatusMessage(t('Rota cadastrada.'));
    } catch {
      setError(t('Não foi possível criar rota.'));
    }
  }

  async function createZone() {
    setError('');
    setStatusMessage('');
    const fee = Number(zoneFee);
    const estimatedMinutes = Number(zoneEstimate);
    if (
      !zoneName.trim() ||
      !zoneFee.trim() ||
      !Number.isFinite(fee) ||
      fee < 0 ||
      fee > 9999.99 ||
      !zoneEstimate.trim() ||
      !Number.isInteger(estimatedMinutes) ||
      estimatedMinutes < 5 ||
      estimatedMinutes > 300
    ) {
      const field = !zoneName.trim()
        ? 'name'
        : !zoneFee.trim() || !Number.isFinite(fee) || fee < 0 || fee > 9999.99
          ? 'fee'
          : 'estimate';
      const message = t('Informe nome, taxa e prazo válidos para a zona.');
      setZoneCreateFieldError(field);
      setZoneCreateErrorMessage(message);
      setError(message);
      if (field === 'name') zoneNameInputRef.current?.focus();
      else if (field === 'fee') zoneFeeInputRef.current?.focus();
      else zoneEstimateInputRef.current?.focus();
      return;
    }

    setError('');
    setStatusMessage('');
    setZoneCreateFieldError(null);
    setZoneCreateErrorMessage('');
    try {
      await deliveryService.createZone({
        name: zoneName.trim(),
        fee,
        estimatedMinutes,
      });
      setZoneName('');
      setZoneFee('');
      setZoneEstimate('45');
      if ((await loadAll()) === null) return;
      setStatusMessage(t('Zona de entrega cadastrada.'));
    } catch {
      setError(t('Não foi possível criar a zona. Verifique se o nome já está cadastrado.'));
    }
  }

  function clearZoneCreateFieldError(field: 'name' | 'fee' | 'estimate') {
    if (zoneCreateFieldError === field) {
      setZoneCreateFieldError(null);
      setZoneCreateErrorMessage('');
      setError('');
    }
  }

  async function updateZone(zone: DeliveryZone, values: Partial<Pick<DeliveryZone, 'name' | 'fee' | 'estimatedMinutes' | 'isActive'>>) {
    setError('');
    setStatusMessage('');
    setZoneEditFieldError(null);
    setZoneEditErrorMessage('');
    try {
      await deliveryService.updateZone(zone.id, values);
      if ((await loadAll()) === null) return;
      setEditingZoneId(null);
      setStatusMessage(t('Zona de entrega atualizada.'));
    } catch {
      setError(t('Não foi possível atualizar a zona de entrega.'));
    }
  }

  function startEditingZone(zone: DeliveryZone) {
    setEditingZoneId(zone.id);
    setZoneEditFieldError(null);
    setZoneEditErrorMessage('');
    setEditZoneName(zone.name);
    setEditZoneFee(String(zone.fee));
    setEditZoneEstimate(String(zone.estimatedMinutes));
  }

  function clearZoneEditFieldError(field: 'name' | 'fee' | 'estimate') {
    if (zoneEditFieldError === field) {
      setZoneEditFieldError(null);
      setZoneEditErrorMessage('');
      setError('');
    }
  }

  async function saveZone(zone: DeliveryZone) {
    const fee = Number(editZoneFee);
    const estimatedMinutes = Number(editZoneEstimate);
    if (
      !editZoneName.trim() ||
      !editZoneFee.trim() ||
      !editZoneEstimate.trim() ||
      !Number.isFinite(fee) ||
      fee < 0 ||
      fee > 9999.99 ||
      !Number.isInteger(estimatedMinutes) ||
      estimatedMinutes < 5 ||
      estimatedMinutes > 300
    ) {
      const field = !editZoneName.trim()
        ? 'name'
        : !editZoneFee.trim() || !Number.isFinite(fee) || fee < 0 || fee > 9999.99
          ? 'fee'
          : 'estimate';
      const message = t('Informe nome, taxa e prazo validos para a zona.');
      setError(message);
      setZoneEditFieldError(field);
      setZoneEditErrorMessage(message);
      if (field === 'name') zoneEditorNameRef.current?.focus();
      else if (field === 'fee') {
        zoneEditorFeeRef.current?.focus();
      }
      else zoneEditorEstimateRef.current?.focus();
      return;
    }

    setZoneEditFieldError(null);
    setZoneEditErrorMessage('');
    await updateZone(zone, {
      name: editZoneName.trim(),
      fee,
      estimatedMinutes,
    });
  }

  async function assignDelivery(deliveryId: string, courierId: string) {
    if (!courierId) return;
    setAssigningDeliveryId(deliveryId);
    setError('');
    setStatusMessage('');
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

      if ((await loadAll()) === null) return;
      setStatusMessage(t('Entrega atribuída ao entregador.'));
    } catch {
      setError(t('Não foi possível atribuir entrega.'));
    } finally {
      setAssigningDeliveryId(null);
    }
  }

  async function updateStatus(deliveryId: string, status: DeliveryStatus) {
    setAssigningDeliveryId(deliveryId);
    setError('');
    setStatusMessage('');
    try {
      await deliveryService.updateStatus(deliveryId, status);
      if ((await loadAll()) === null) return;
      setStatusMessage(t('Status da entrega atualizado.'));
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
              {t('Gerencie pedidos de delivery, entregadores, áreas atendidas e roteirização por zona.')}
            </p>
          </div>

          <button
            type="button"
            onClick={syncReadyOrders}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            <Send size={16} />
            {t('Reconciliar pedidos prontos')}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert" aria-live="assertive">
          {error}
        </div>
      ) : null}
      <p
        className={statusMessage ? 'mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900' : 'sr-only'}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </p>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm" aria-busy={loading}>
          <h2 className="text-lg font-bold text-stone-900">{t('Fila de entregas')}</h2>
          <p className="mt-1 text-sm text-stone-600">{t('Pedidos de delivery desde a entrada até a conclusão')}</p>

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
          <p className="mt-1 text-xs text-stone-700">{t('Campos marcados com * são obrigatórios.')}</p>

          <div className="mt-4 space-y-3 rounded-2xl border border-stone-200 p-4">
            <p className="text-sm font-semibold text-stone-900">{t('Novo entregador')}</p>
            <label htmlFor="deliveryCourierName" className="block text-sm font-medium text-stone-800">
              {t('Nome do entregador')} *
            </label>
            <input
              id="deliveryCourierName"
              ref={courierNameInputRef}
              required
              value={courierName}
              onChange={(event) => setCourierName(event.target.value)}
              placeholder={t('Nome do entregador')}
              className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
            />
            <label htmlFor="deliveryCourierZone" className="block text-sm font-medium text-stone-800">
              {t('Zona do entregador')} ({t('opcional')})
            </label>
            <input
              id="deliveryCourierZone"
              value={courierZone}
              onChange={(event) => setCourierZone(event.target.value)}
              placeholder={t('Zona (opcional)')}
              className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
            />
            <button
              type="button"
              onClick={createCourier}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
            >
              <Plus size={14} />
              {t('Adicionar entregador')}
            </button>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-stone-200 p-4">
            <p className="text-sm font-semibold text-stone-900">{t('Nova rota')}</p>
            <label htmlFor="deliveryRouteName" className="block text-sm font-medium text-stone-800">
              {t('Nome da rota')} *
            </label>
            <input
              id="deliveryRouteName"
              ref={routeNameInputRef}
              required
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              placeholder={t('Nome da rota')}
              className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
            />
            <label htmlFor="deliveryRouteZone" className="block text-sm font-medium text-stone-800">
              {t('Zona da rota')} *
            </label>
            <input
              id="deliveryRouteZone"
              ref={routeZoneInputRef}
              required
              value={routeZone}
              onChange={(event) => setRouteZone(event.target.value)}
              placeholder={t('Zona da rota')}
              className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
            />
            <button
              type="button"
              onClick={createRoute}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-500 bg-white px-3 py-2 text-sm font-semibold text-stone-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
            >
              <Route size={14} />
              {t('Adicionar rota')}
            </button>
          </div>
        </article>
      </div>

      <section className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="delivery-zones-heading" aria-busy={loading}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="delivery-zones-heading" className="text-lg font-bold text-stone-900">
              {t('Áreas atendidas e taxas')}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {t('Cadastre as regiões disponíveis no checkout, com taxa e prazo estimado.')}
            </p>
            <p className="mt-1 text-xs text-stone-700">{t('Campos marcados com * são obrigatórios.')}</p>
          </div>
        </div>

        <form
          className="mt-4 grid gap-3 rounded-2xl border border-stone-200 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void createZone();
          }}
        >
          <div>
            <label htmlFor="deliveryZoneName" className="mb-1 block text-sm font-medium text-stone-800">
              {t('Nome da zona')} *
            </label>
            <input
              id="deliveryZoneName"
              ref={zoneNameInputRef}
              value={zoneName}
              onChange={(event) => {
                setZoneName(event.target.value);
                clearZoneCreateFieldError('name');
              }}
              required
              maxLength={80}
              placeholder={t('Ex.: Centro')}
              aria-invalid={zoneCreateFieldError === 'name'}
              aria-describedby={zoneCreateFieldError === 'name' ? 'deliveryZoneNameError' : undefined}
              className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
            />
            {zoneCreateFieldError === 'name' && (
              <p id="deliveryZoneNameError" className="mt-1 text-sm text-red-800">
                {zoneCreateErrorMessage}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="deliveryZoneFee" className="mb-1 block text-sm font-medium text-stone-800">
              {t('Taxa (R$)')} *
            </label>
            <input
              id="deliveryZoneFee"
              ref={zoneFeeInputRef}
              type="number"
              min="0"
              max="9999.99"
              step="0.01"
              value={zoneFee}
              onChange={(event) => {
                setZoneFee(event.target.value);
                clearZoneCreateFieldError('fee');
              }}
              required
              aria-invalid={zoneCreateFieldError === 'fee'}
              aria-describedby={zoneCreateFieldError === 'fee' ? 'deliveryZoneFeeError' : undefined}
              className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
            />
            {zoneCreateFieldError === 'fee' && (
              <p id="deliveryZoneFeeError" className="mt-1 text-sm text-red-800">
                {zoneCreateErrorMessage}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="deliveryZoneEstimate" className="mb-1 block text-sm font-medium text-stone-800">
              {t('Prazo (minutos)')} *
            </label>
            <input
              id="deliveryZoneEstimate"
              ref={zoneEstimateInputRef}
              type="number"
              min="5"
              max="300"
              step="1"
              value={zoneEstimate}
              onChange={(event) => {
                setZoneEstimate(event.target.value);
                clearZoneCreateFieldError('estimate');
              }}
              required
              aria-invalid={zoneCreateFieldError === 'estimate'}
              aria-describedby={zoneCreateFieldError === 'estimate' ? 'deliveryZoneEstimateError' : undefined}
              className="min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
            />
            {zoneCreateFieldError === 'estimate' && (
              <p id="deliveryZoneEstimateError" className="mt-1 text-sm text-red-800">
                {zoneCreateErrorMessage}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
          >
            <Plus size={16} aria-hidden="true" />
            {t('Adicionar zona')}
          </button>
        </form>

        {loading ? (
          <p className="mt-4 text-sm text-stone-600">{t('Carregando zonas...')}</p>
        ) : zones.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
            {t('Nenhuma zona cadastrada. O delivery ficará indisponível no checkout até configurar uma área.')}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-200">
            {zones.map((zone) => (
              <li key={zone.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                {editingZoneId === zone.id ? (
                  <div className="grid flex-1 gap-3 sm:grid-cols-3">
                    <label className="text-sm font-medium text-stone-800">
                      {t('Nome')} *
                      <input
                        ref={zoneEditorNameRef}
                        value={editZoneName}
                        onChange={(event) => {
                          setEditZoneName(event.target.value);
                          clearZoneEditFieldError('name');
                        }}
                        required
                        maxLength={80}
                        aria-invalid={zoneEditFieldError === 'name'}
                        aria-describedby={zoneEditFieldError === 'name' ? 'zoneEditNameError' : undefined}
                        className="mt-1 min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
                      />
                      {zoneEditFieldError === 'name' && (
                        <span id="zoneEditNameError" className="mt-1 block text-sm text-red-800">
                          {zoneEditErrorMessage}
                        </span>
                      )}
                    </label>
                    <label className="text-sm font-medium text-stone-800">
                      {t('Taxa (R$)')} *
                      <input
                        ref={zoneEditorFeeRef}
                        type="number"
                        min="0"
                        max="9999.99"
                        step="0.01"
                        value={editZoneFee}
                        onChange={(event) => {
                          setEditZoneFee(event.target.value);
                          clearZoneEditFieldError('fee');
                        }}
                        required
                        aria-invalid={zoneEditFieldError === 'fee'}
                        aria-describedby={zoneEditFieldError === 'fee' ? 'zoneEditFeeError' : undefined}
                        className="mt-1 min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
                      />
                      {zoneEditFieldError === 'fee' && (
                        <span id="zoneEditFeeError" className="mt-1 block text-sm text-red-800">
                          {zoneEditErrorMessage}
                        </span>
                      )}
                    </label>
                    <label className="text-sm font-medium text-stone-800">
                      {t('Prazo (minutos)')} *
                      <input
                        ref={zoneEditorEstimateRef}
                        type="number"
                        min="5"
                        max="300"
                        step="1"
                        value={editZoneEstimate}
                        onChange={(event) => {
                          setEditZoneEstimate(event.target.value);
                          clearZoneEditFieldError('estimate');
                        }}
                        required
                        aria-invalid={zoneEditFieldError === 'estimate'}
                        aria-describedby={zoneEditFieldError === 'estimate' ? 'zoneEditEstimateError' : undefined}
                        className="mt-1 min-h-11 w-full rounded-xl border border-stone-500 px-3 py-2 text-base text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
                      />
                      {zoneEditFieldError === 'estimate' && (
                        <span id="zoneEditEstimateError" className="mt-1 block text-sm text-red-800">
                          {zoneEditErrorMessage}
                        </span>
                      )}
                    </label>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-stone-900">{zone.name}</p>
                    <p className="mt-1 text-sm text-stone-600">
                      R$ {zone.fee.toFixed(2).replace('.', ',')} · {zone.estimatedMinutes} {t('minutos')} ·{' '}
                      {zone.isActive ? t('Ativa') : t('Inativa')}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {editingZoneId === zone.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveZone(zone)}
                        className="min-h-11 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
                      >
                        {t('Salvar')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingZoneId(null)}
                        className="min-h-11 rounded-xl border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
                      >
                        {t('Cancelar')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        ref={(element) => {
                          if (element) zoneEditButtonRefs.current.set(zone.id, element);
                          else zoneEditButtonRefs.current.delete(zone.id);
                        }}
                        onClick={() => startEditingZone(zone)}
                        className="min-h-11 rounded-xl border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
                      >
                        {t('Editar')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateZone(zone, { isActive: !zone.isActive })}
                        className="min-h-11 rounded-xl border border-stone-500 px-4 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
                      >
                        {zone.isActive ? t('Desativar') : t('Ativar')}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">{t('Preparação para iFood e 99Food')}</p>
        <p className="mt-1">
          {t('A conexão externa permanece desativada até a habilitação das contas e a validação das APIs oficiais.')}
        </p>
      </aside>

      <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm" aria-busy={loading}>
        <h2 className="text-lg font-bold text-stone-900">{t('Painel operacional de entregas')}</h2>

        {loading ? (
          <p className="mt-4 text-sm text-stone-500">{t('Carregando delivery...')}</p>
        ) : queue.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            {t('Nenhuma entrega na fila. Novos pedidos de delivery serão adicionados automaticamente.')}
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
                    <p className="text-xs text-stone-600">
                      {t('Preparo')}: {t(orderStatusLabels[item.orderStatus] ?? item.orderStatus)}
                    </p>
                    {item.customerPhone && (
                      <a className="mt-1 inline-block text-sm font-medium text-blue-800 underline" href={`tel:${item.customerPhone}`}>
                        {item.customerPhone}
                      </a>
                    )}
                    {item.fulfillmentType === 'DELIVERY' && (
                      <div className="mt-3 space-y-1 text-sm text-stone-700">
                        <p className="flex items-start gap-2">
                          <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                          <span>
                            {item.deliveryAddress}
                            {item.deliveryComplement ? ` · ${item.deliveryComplement}` : ''}
                            {item.deliveryReference ? ` · ${t('Referência')}: ${item.deliveryReference}` : ''}
                            {item.deliveryZoneName ? ` · ${item.deliveryZoneName}` : ''}
                          </span>
                        </p>
                        <p>{t(paymentLabels[item.paymentMethod] ?? item.paymentMethod)} · {t('Total')}: R$ {item.finalPrice.toFixed(2).replace('.', ',')}</p>
                        {item.cashChangeFor && (
                          <p>{t('Troco para')}: R$ {item.cashChangeFor.toFixed(2).replace('.', ',')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <label htmlFor={`delivery-courier-${item.id}`} className="sr-only">
                      {t('Atribuir entregador ao pedido #{number}', { number: item.orderNumber })}
                    </label>
                    <select
                      id={`delivery-courier-${item.id}`}
                      defaultValue=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        void assignDelivery(item.id, event.target.value);
                        event.target.value = '';
                      }}
                      disabled={assigningDeliveryId === item.id}
                      className="min-h-11 rounded-xl border border-stone-500 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
                    >
                      <option value="">{t('Atribuir entregador')}</option>
                      {couriers.filter((courier) => courier.isActive).map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name}{courier.zone ? ` (${courier.zone})` : ''}
                        </option>
                      ))}
                    </select>

                    <label htmlFor={`delivery-status-${item.id}`} className="sr-only">
                      {t('Atualizar status da entrega do pedido #{number}', { number: item.orderNumber })}
                    </label>
                    <select
                      id={`delivery-status-${item.id}`}
                      defaultValue=""
                      onChange={(event) => {
                        if (!event.target.value) return;
                        void updateStatus(item.id, event.target.value as DeliveryStatus);
                        event.target.value = '';
                      }}
                      disabled={assigningDeliveryId === item.id || getNextStatusOptions(item).length === 0}
                      className="min-h-11 rounded-xl border border-stone-500 bg-white px-3 py-2 text-sm text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-800"
                    >
                      <option value="">{t('Atualizar status')}</option>
                      {getNextStatusOptions(item).map((status) => (
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
