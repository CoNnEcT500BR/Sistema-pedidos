import { prisma } from '@/shared/database/prismaClient.js';
import { isAllowedDeliveryStatusTransition } from './deliveryTypes.js';
import type {
  AssignDeliveryInput,
  CreateCourierInput,
  CreateRouteInput,
  CreateDeliveryZoneInput,
  DeliveryZone,
  UpdateDeliveryZoneInput,
  DeliveryCourier,
  DeliveryHistoryEntry,
  DeliveryRecord,
  DeliveryRoute,
  DeliveryStatus,
  ListDeliveriesQueryInput,
} from './deliveryTypes.js';

function mapDeliveryRecord(input: {
  id: string;
  orderId: string;
  status: string;
  priority: number;
  promisedAt: Date | null;
  courierId: string | null;
  routeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  order: {
    orderNumber: number;
    status: string;
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
    fulfillmentType: string;
    deliveryAddress: string | null;
    deliveryComplement: string | null;
    deliveryReference: string | null;
    deliveryZoneName: string | null;
    deliveryFee: number;
    paymentMethod: string;
    cashChangeFor: number | null;
    finalPrice: number;
  };
  history: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    reason: string | null;
    changedAt: Date;
  }>;
}): DeliveryRecord {
  return {
    id: input.id,
    orderId: input.orderId,
    orderNumber: input.order.orderNumber,
    orderStatus: input.order.status,
    customerName: input.order.customerName,
    customerPhone: input.order.customerPhone,
    notes: input.order.notes,
    fulfillmentType: input.order.fulfillmentType as 'PICKUP' | 'DELIVERY',
    deliveryAddress: input.order.deliveryAddress,
    deliveryComplement: input.order.deliveryComplement,
    deliveryReference: input.order.deliveryReference,
    deliveryZoneName: input.order.deliveryZoneName,
    deliveryFee: input.order.deliveryFee,
    paymentMethod: input.order.paymentMethod,
    cashChangeFor: input.order.cashChangeFor,
    finalPrice: input.order.finalPrice,
    status: input.status as DeliveryStatus,
    priority: input.priority,
    promisedAt: input.promisedAt?.toISOString(),
    courierId: input.courierId ?? undefined,
    routeId: input.routeId ?? undefined,
    createdAt: input.createdAt.toISOString(),
    updatedAt: input.updatedAt.toISOString(),
    history: input.history.map(
      (entry): DeliveryHistoryEntry => ({
        id: entry.id,
        fromStatus: entry.fromStatus as DeliveryStatus | 'SYSTEM',
        toStatus: entry.toStatus as DeliveryStatus,
        reason: entry.reason ?? undefined,
        changedAt: entry.changedAt.toISOString(),
      }),
    ),
  };
}

async function getPersistedDeliveryById(id: string) {
  const found = await prisma.delivery.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true,
          customerName: true,
          customerPhone: true,
          notes: true,
          fulfillmentType: true,
          deliveryAddress: true,
          deliveryComplement: true,
          deliveryReference: true,
          deliveryZoneName: true,
          deliveryFee: true,
          paymentMethod: true,
          cashChangeFor: true,
          finalPrice: true,
        },
      },
      history: {
        orderBy: { changedAt: 'asc' },
      },
    },
  });

  if (!found) {
    throw new Error('Entrega nao encontrada');
  }

  return found;
}

function priorityScore(item: DeliveryRecord): number {
  const promisedTime = item.promisedAt
    ? new Date(item.promisedAt).getTime()
    : Number.POSITIVE_INFINITY;
  const overdueWeight = promisedTime < Date.now() ? 1000 : 0;
  return (
    overdueWeight + item.priority * 100 - Math.floor(new Date(item.createdAt).getTime() / 1000)
  );
}

export const deliveryService = {
  async syncReadyOrdersToQueue() {
    const readyOrders = await prisma.order.findMany({
      where: {
        status: 'READY',
        fulfillmentType: 'DELIVERY',
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    for (const order of readyOrders) {
      await prisma.delivery.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          status: 'QUEUED',
          priority: 3,
          history: {
            create: {
              fromStatus: 'SYSTEM',
              toStatus: 'QUEUED',
              reason: 'Pedido pronto para expedicao',
            },
          },
        },
        update: {},
      });
    }

    return await deliveryService.listDeliveries({});
  },

  async listDeliveries(filters: ListDeliveriesQueryInput) {
    const data = await prisma.delivery.findMany({
      where: {
        status: filters.status,
        courierId: filters.courierId,
        route: filters.zone
          ? {
              zone: filters.zone,
            }
          : undefined,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            customerName: true,
            customerPhone: true,
            notes: true,
            fulfillmentType: true,
            deliveryAddress: true,
            deliveryComplement: true,
            deliveryReference: true,
            deliveryZoneName: true,
            deliveryFee: true,
            paymentMethod: true,
            cashChangeFor: true,
            finalPrice: true,
          },
        },
        history: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    return data
      .map((entry) => mapDeliveryRecord(entry))
      .sort((a, b) => priorityScore(b) - priorityScore(a));
  },

  async getDeliveryById(id: string) {
    return mapDeliveryRecord(await getPersistedDeliveryById(id));
  },

  async createCourier(payload: CreateCourierInput) {
    const courier = await prisma.deliveryCourier.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        zone: payload.zone,
        isActive: payload.isActive,
      },
    });

    return {
      id: courier.id,
      name: payload.name,
      phone: payload.phone,
      zone: payload.zone,
      isActive: payload.isActive,
      createdAt: courier.createdAt.toISOString(),
      updatedAt: courier.updatedAt.toISOString(),
    };
  },

  async listCouriers() {
    const couriers = await prisma.deliveryCourier.findMany({
      orderBy: { name: 'asc' },
    });

    return couriers.map(
      (entry): DeliveryCourier => ({
        id: entry.id,
        name: entry.name,
        phone: entry.phone ?? undefined,
        zone: entry.zone ?? undefined,
        isActive: entry.isActive,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      }),
    );
  },

  async createRoute(payload: CreateRouteInput) {
    const route = await prisma.deliveryRoute.create({
      data: {
        name: payload.name,
        zone: payload.zone,
        isActive: payload.isActive,
      },
    });

    return {
      id: route.id,
      name: payload.name,
      zone: payload.zone,
      isActive: payload.isActive,
      createdAt: route.createdAt.toISOString(),
      updatedAt: route.updatedAt.toISOString(),
    };
  },

  async listRoutes() {
    const routes = await prisma.deliveryRoute.findMany({
      orderBy: { name: 'asc' },
    });

    return routes.map(
      (entry): DeliveryRoute => ({
        id: entry.id,
        name: entry.name,
        zone: entry.zone,
        isActive: entry.isActive,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      }),
    );
  },

  async listDeliveryZones(includeInactive = false): Promise<DeliveryZone[]> {
    const zones = await prisma.deliveryZone.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });

    return zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      fee: zone.fee,
      estimatedMinutes: zone.estimatedMinutes,
      isActive: zone.isActive,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    }));
  },

  async createDeliveryZone(payload: CreateDeliveryZoneInput): Promise<DeliveryZone> {
    const zone = await prisma.deliveryZone.create({ data: payload });
    return {
      id: zone.id,
      name: zone.name,
      fee: zone.fee,
      estimatedMinutes: zone.estimatedMinutes,
      isActive: zone.isActive,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    };
  },

  async updateDeliveryZone(id: string, payload: UpdateDeliveryZoneInput): Promise<DeliveryZone> {
    const zone = await prisma.deliveryZone.update({ where: { id }, data: payload });
    return {
      id: zone.id,
      name: zone.name,
      fee: zone.fee,
      estimatedMinutes: zone.estimatedMinutes,
      isActive: zone.isActive,
      createdAt: zone.createdAt.toISOString(),
      updatedAt: zone.updatedAt.toISOString(),
    };
  },

  async assignDelivery(id: string, payload: AssignDeliveryInput) {
    const item = await getPersistedDeliveryById(id);
    if (!['QUEUED', 'ASSIGNED', 'FAILED'].includes(item.status)) {
      throw new Error('A entrega nao pode ser atribuida neste status');
    }

    const courier = await prisma.deliveryCourier.findUnique({ where: { id: payload.courierId } });
    if (!courier || !courier.isActive) {
      throw new Error('Entregador invalido ou inativo');
    }

    if (
      courier.zone &&
      item.order.deliveryZoneName &&
      courier.zone.trim().toLocaleLowerCase() !== item.order.deliveryZoneName.trim().toLocaleLowerCase()
    ) {
      throw new Error('O entregador nao atende a zona desta entrega');
    }

    let route;
    if (payload.routeId) {
      route = await prisma.deliveryRoute.findUnique({ where: { id: payload.routeId } });
      if (!route || !route.isActive) {
        throw new Error('Rota invalida ou inativa');
      }
      if (
        item.order.deliveryZoneName &&
        route.zone.trim().toLocaleLowerCase() !== item.order.deliveryZoneName.trim().toLocaleLowerCase()
      ) {
        throw new Error('A rota nao atende a zona desta entrega');
      }
    }

    const nextStatus = 'ASSIGNED';

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        courierId: payload.courierId,
        routeId: payload.routeId,
        priority: payload.priority ?? item.priority,
        promisedAt: payload.promisedAt ? new Date(payload.promisedAt) : item.promisedAt,
        status: nextStatus,
        history:
          item.status !== nextStatus
            ? {
                create: {
                  fromStatus: item.status,
                  toStatus: nextStatus,
                  reason: 'Entrega atribuida',
                },
              }
            : undefined,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            customerName: true,
            customerPhone: true,
            notes: true,
            fulfillmentType: true,
            deliveryAddress: true,
            deliveryComplement: true,
            deliveryReference: true,
            deliveryZoneName: true,
            deliveryFee: true,
            paymentMethod: true,
            cashChangeFor: true,
            finalPrice: true,
          },
        },
        history: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    return mapDeliveryRecord(updated);
  },

  async updateDeliveryStatus(id: string, status: DeliveryStatus, reason?: string) {
    const item = await getPersistedDeliveryById(id);
    if (item.status === status) {
      return mapDeliveryRecord(item);
    }

    if (!isAllowedDeliveryStatusTransition(item.status as DeliveryStatus, status)) {
      throw new Error('Transicao de status da entrega invalida');
    }

    if (
      ['DISPATCHED', 'IN_ROUTE', 'DELIVERED'].includes(status) &&
      item.order.status !== 'READY'
    ) {
      throw new Error('O pedido precisa estar pronto antes de sair para entrega');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const deliveryUpdate = await tx.delivery.updateMany({
        where: { id, status: item.status },
        data: { status },
      });
      if (deliveryUpdate.count !== 1) {
        throw new Error('O status da entrega foi alterado. Atualize e tente novamente.');
      }

      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: id,
          fromStatus: item.status,
          toStatus: status,
          reason,
        },
      });

      if (status === 'DELIVERED') {
        const orderUpdate = await tx.order.updateMany({
          where: { id: item.orderId, status: 'READY' },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        if (orderUpdate.count !== 1) {
          throw new Error('O pedido mudou de status antes da confirmacao da entrega');
        }

        await tx.orderStatusHistory.create({
          data: {
            orderId: item.orderId,
            fromStatus: 'READY',
            toStatus: 'COMPLETED',
            reason: reason ?? 'Entregue',
          },
        });
      }

      return tx.delivery.findUniqueOrThrow({
        where: { id },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              customerName: true,
              customerPhone: true,
              notes: true,
              fulfillmentType: true,
              deliveryAddress: true,
              deliveryComplement: true,
              deliveryReference: true,
              deliveryZoneName: true,
              deliveryFee: true,
              paymentMethod: true,
              cashChangeFor: true,
              finalPrice: true,
            },
          },
          history: { orderBy: { changedAt: 'asc' } },
        },
      });
    });

    return mapDeliveryRecord(updated);
  },
};
