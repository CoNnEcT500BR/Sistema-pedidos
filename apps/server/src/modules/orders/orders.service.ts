import { calculateOrderTotal, OrderCalculationError } from './orders.calculator.js';
import {
  InsufficientInventoryError,
  OrderStatusConflictError,
  ordersRepository,
} from './orders.repository.js';
import type {
  CreateOrderInput,
  ListOrdersQuery,
  OrderStatus,
  UpdateOrderStatusInput,
} from './ordersTypes.js';
import { isAllowedOrderStatusTransition } from './ordersTypes.js';

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

    return await ordersRepository.createOrder({
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      notes: payload.notes,
      calculated,
    });
  } catch (error) {
    if (error instanceof OrderCalculationError) {
      throw new OrderServiceError(error.message, error.statusCode);
    }
    if (error instanceof InsufficientInventoryError) {
      throw new OrderServiceError(error.message, 409);
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
  if (!isAllowedOrderStatusTransition(currentStatus, payload.status)) {
    throw new OrderServiceError('Transicao de status invalida', 400);
  }

  let updated;
  try {
    updated = await ordersRepository.updateStatus(
      id,
      currentStatus,
      payload.status,
      payload.reason,
    );
  } catch (error) {
    if (error instanceof OrderStatusConflictError) {
      throw new OrderServiceError('O status do pedido foi alterado. Atualize e tente novamente.', 409);
    }

    throw error;
  }
  if (!updated) {
    throw new OrderServiceError('Pedido nao encontrado', 404);
  }

  return getOrderById(id);
}
