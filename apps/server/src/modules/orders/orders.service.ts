import { calculateOrderTotal, OrderCalculationError } from './orders.calculator';
import { ordersRepository } from './orders.repository';
import type {
  CreateOrderInput,
  ListOrdersQuery,
  OrderStatus,
  UpdateOrderStatusInput,
} from './orders.types';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export class OrderServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function isOrderServiceError(error: unknown): error is OrderServiceError {
  return error instanceof OrderServiceError;
}

export async function createOrder(payload: CreateOrderInput) {
  try {
    const calculated = await calculateOrderTotal(payload.items);

    return ordersRepository.createOrder({
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      notes: payload.notes,
      calculated,
    });
  } catch (error) {
    if (error instanceof OrderCalculationError) {
      throw new OrderServiceError(error.message, error.statusCode);
    }

    throw error;
  }
}

export async function listOrders(filters: ListOrdersQuery) {
  return ordersRepository.listOrders(filters);
}

export async function getOrderById(id: string) {
  const order = await ordersRepository.findById(id);
  if (!order) {
    throw new OrderServiceError('Pedido nao encontrado', 404);
  }

  return order;
}

export async function updateOrderStatus(id: string, payload: UpdateOrderStatusInput) {
  const current = await ordersRepository.findById(id);
  if (!current) {
    throw new OrderServiceError('Pedido nao encontrado', 404);
  }

  if (current.status === payload.status) {
    return current;
  }

  const currentStatus = current.status as OrderStatus;
  const nextAllowed = allowedTransitions[currentStatus] ?? [];

  if (!nextAllowed.includes(payload.status)) {
    throw new OrderServiceError('Transicao de status invalida', 400);
  }

  const updated = await ordersRepository.updateStatus(id, payload.status, payload.reason);
  if (!updated) {
    throw new OrderServiceError('Pedido nao encontrado', 404);
  }

  return getOrderById(id);
}
