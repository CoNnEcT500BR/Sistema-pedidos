import { prisma } from '@/shared/database/prisma.client';
import { updateOrderStatus } from '@/modules/orders/orders.service';
import type {
  AssignDeliveryInput,
  CreateCourierInput,
  CreateRouteInput,
  DeliveryCourier,
  DeliveryHistoryEntry,
  DeliveryRecord,
  DeliveryRoute,
  DeliveryStatus,
  ListDeliveriesQueryInput,
} from './delivery.types';

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
    customerName: string | null;
    customerPhone: string | null;
    notes: string | null;
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
    customerName: input.order.customerName,
    customerPhone: input.order.customerPhone,
    notes: input.order.notes,
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
          customerName: true,
          customerPhone: true,
          notes: true,
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
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    for (const order of readyOrders) {
      const existing = await prisma.delivery.findUnique({ where: { orderId: order.id } });
      if (existing) {
        continue;
      }

      const created = await prisma.delivery.create({
        data: {
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
      });

      void created;
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
            customerName: true,
            customerPhone: true,
            notes: true,
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

  async assignDelivery(id: string, payload: AssignDeliveryInput) {
    const item = await getPersistedDeliveryById(id);
    const courier = await prisma.deliveryCourier.findUnique({ where: { id: payload.courierId } });
    if (!courier || !courier.isActive) {
      throw new Error('Entregador invalido ou inativo');
    }

    if (payload.routeId) {
      const route = await prisma.deliveryRoute.findUnique({ where: { id: payload.routeId } });
      if (!route || !route.isActive) {
        throw new Error('Rota invalida ou inativa');
      }
    }

    const nextStatus = item.status === 'QUEUED' ? 'ASSIGNED' : item.status;

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        courierId: payload.courierId,
        routeId: payload.routeId,
        priority: payload.priority ?? item.priority,
        promisedAt: payload.promisedAt ? new Date(payload.promisedAt) : item.promisedAt,
        status: nextStatus,
        history:
          item.status === 'QUEUED'
            ? {
                create: {
                  fromStatus: 'QUEUED',
                  toStatus: 'ASSIGNED',
                  reason: 'Entrega atribuida',
                },
              }
            : undefined,
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            notes: true,
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

    let updated = item;
    if (item.status !== status) {
      updated = await prisma.delivery.update({
        where: { id },
        data: {
          status,
          history: {
            create: {
              fromStatus: item.status,
              toStatus: status,
              reason,
            },
          },
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              customerName: true,
              customerPhone: true,
              notes: true,
            },
          },
          history: {
            orderBy: { changedAt: 'asc' },
          },
        },
      });
    }

    if (status === 'DELIVERED') {
      try {
        await updateOrderStatus(item.orderId, {
          status: 'COMPLETED',
          reason: reason ?? 'Entregue',
        });
      } catch {
        // Pedido pode estar em estado diferente; nao bloqueia fluxo de entrega.
      }
    }

    return mapDeliveryRecord(updated);
  },
};
