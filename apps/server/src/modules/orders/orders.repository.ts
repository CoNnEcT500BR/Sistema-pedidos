import { prisma } from '@/shared/database/prisma.client';

import type { CalculatedOrderResult, OrderStatus } from './orders.types';

export const ordersRepository = {
  getNextOrderNumber: async () => {
    const result = await prisma.order.aggregate({
      _max: { orderNumber: true },
    });

    return (result._max.orderNumber ?? 0) + 1;
  },

  createOrder: async (payload: {
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    calculated: CalculatedOrderResult;
  }) => {
    const orderNumber = await ordersRepository.getNextOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        totalPrice: payload.calculated.totalAmount,
        discount: 0,
        finalPrice: payload.calculated.totalAmount,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        notes: payload.notes,
        items: {
          create: payload.calculated.items.map((item) => ({
            menuItemId: item.menuItemId,
            comboId: item.comboId,
            quantity: item.quantity,
            itemPrice: item.unitPrice,
            notes: item.notes,
            addons: {
              create: item.addons.map((addon) => ({
                addonId: addon.addonId,
                quantity: addon.quantity,
                addonPrice: addon.addonPrice,
              })),
            },
          })),
        },
        statusHistory: {
          create: {
            fromStatus: 'SYSTEM',
            toStatus: 'PENDING',
            reason: 'Order created',
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
            combo: true,
            addons: {
              include: {
                addon: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    return order;
  },

  listOrders: async (filters: { status?: OrderStatus; date?: string }) => {
    const where: Record<string, unknown> = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.date) {
      const start = new Date(filters.date + 'T00:00:00.000Z');
      const end = new Date(filters.date + 'T23:59:59.999Z');
      where.createdAt = {
        gte: start,
        lte: end,
      };
    }

    return prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            menuItem: true,
            combo: true,
            addons: {
              include: {
                addon: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById: async (id: string) => {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: true,
            combo: true,
            addons: {
              include: {
                addon: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });
  },

  updateStatus: async (id: string, status: OrderStatus, reason?: string) => {
    return prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({ where: { id } });
      if (!currentOrder) {
        return null;
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : currentOrder.completedAt,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: currentOrder.status,
          toStatus: status,
          reason,
        },
      });

      return updated;
    });
  },
};
