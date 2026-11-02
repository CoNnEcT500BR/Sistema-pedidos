import { prisma } from '@/shared/database/prismaClient.js';

import {
  isAllowedOrderStatusTransition,
  type CalculatedOrderResult,
  type OrderStatus,
} from './ordersTypes.js';

export class InsufficientInventoryError extends Error {
  constructor(public readonly ingredientId: string) {
    super('Estoque insuficiente para concluir o pedido.');
  }
}

export class OrderStatusConflictError extends Error {
  constructor() {
    super('O status do pedido foi alterado durante a operação.');
  }
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

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
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = await ordersRepository.getNextOrderNumber();

      try {
        const order = await prisma.$transaction(async (tx) => {
          const createdOrder = await tx.order.create({
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
                removedIngredientsJson: JSON.stringify(item.removedIngredients),
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
            stockReservations: {
              select: { ingredientId: true },
            },
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

          for (const requirement of payload.calculated.stockRequirements) {
            const ingredient = await tx.inventoryIngredient.findUnique({
              where: { id: requirement.ingredientId },
              select: { currentQuantity: true },
            });
            if (!ingredient || ingredient.currentQuantity === null) {
              continue;
            }

            const updated = await tx.inventoryIngredient.updateMany({
              where: {
                id: requirement.ingredientId,
                currentQuantity: { gte: requirement.quantity },
              },
              data: {
                currentQuantity: { decrement: requirement.quantity },
              },
            });
            if (updated.count !== 1) {
              throw new InsufficientInventoryError(requirement.ingredientId);
            }

            await tx.stockReservation.create({
              data: {
                orderId: createdOrder.id,
                ingredientId: requirement.ingredientId,
                quantity: requirement.quantity,
              },
            });
            await tx.inventoryMovement.create({
              data: {
                orderId: createdOrder.id,
                ingredientId: requirement.ingredientId,
                quantityDelta: -requirement.quantity,
                reason: 'ORDER_RESERVED',
              },
            });
          }

          return {
            ...createdOrder,
            stockReservations: await tx.stockReservation.findMany({
              where: { orderId: createdOrder.id, status: 'RESERVED' },
              select: { ingredientId: true },
            }),
          };
        });

        return order;
      } catch (error) {
        if (isUniqueConstraintError(error) && attempt < 4) {
          continue;
        }

        throw error;
      }
    }

    throw new Error('Nao foi possivel criar pedido neste momento');
  },

  listOrders: async (filters: {
    status?: OrderStatus;
    date?: string;
    limit?: number;
    offset?: number;
  }) => {
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
      take: filters.limit,
      skip: filters.offset,
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
        stockReservations: {
          select: { ingredientId: true },
        },
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

  updateStatus: async (
    id: string,
    expectedStatus: OrderStatus,
    status: OrderStatus,
    reason?: string,
  ) => {
    return prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({ where: { id } });
      if (!currentOrder) {
        return null;
      }

      if (
        currentOrder.status !== expectedStatus ||
        !isAllowedOrderStatusTransition(currentOrder.status as OrderStatus, status)
      ) {
        throw new OrderStatusConflictError();
      }

      const statusUpdate = await tx.order.updateMany({
        where: { id, status: expectedStatus },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : currentOrder.completedAt,
        },
      });
      if (statusUpdate.count !== 1) {
        throw new OrderStatusConflictError();
      }

      const updated = await tx.order.findUnique({ where: { id } });
      if (!updated) {
        throw new Error('Pedido desapareceu durante a transacao de atualizacao de status.');
      }

      if (status === 'CANCELLED') {
        const reservations = await tx.stockReservation.findMany({
          where: { orderId: id, status: 'RESERVED' },
        });
        for (const reservation of reservations) {
          const released = await tx.stockReservation.updateMany({
            where: { id: reservation.id, status: 'RESERVED' },
            data: { status: 'RELEASED', releasedAt: new Date() },
          });
          if (released.count !== 1) continue;

          await tx.inventoryIngredient.update({
            where: { id: reservation.ingredientId },
            data: { currentQuantity: { increment: reservation.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              orderId: id,
              ingredientId: reservation.ingredientId,
              quantityDelta: reservation.quantity,
              reason: 'ORDER_CANCELLED',
            },
          });
        }
      }

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
