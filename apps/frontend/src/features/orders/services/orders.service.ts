import { apiClient } from '@/services/api.service';
import type { CartItem } from '@/features/cart/store/cart.store';
import type { Order, OrderDetail, OrderStatus } from '../types/order.types';

interface CreateOrderPayload {
  customerName?: string;
  notes?: string;
  items: Array<{
    menuItemId?: string;
    comboId?: string;
    quantity: number;
    notes?: string;
    addons: Array<{ addonId: string; quantity: number }>;
  }>;
}

export interface CreatedOrder {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  finalPrice: number;
  customerName?: string;
}

export interface ItemValidationError {
  itemIndex: number;
  itemName: string;
  message: string;
}

export interface OrderValidationErrorResponse {
  message: string;
  itemErrors?: ItemValidationError[];
}

interface ApiResponse<T> {
  data: T;
}

function cartItemsToPayload(items: CartItem[]): CreateOrderPayload['items'] {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    comboId: item.comboId,
    quantity: item.quantity,
    notes: item.notes,
    addons: item.addons
      .filter((a) => !a.removed && a.quantity > 0)
      .map((a) => ({ addonId: a.addonId, quantity: a.quantity })),
  }));
}

export const ordersService = {
  async createOrder(
    items: CartItem[],
    customerName?: string,
    notes?: string,
  ): Promise<CreatedOrder> {
    const payload: CreateOrderPayload = {
      customerName,
      notes,
      items: cartItemsToPayload(items),
    };
    const res = await apiClient.post<ApiResponse<CreatedOrder>>('/api/orders', payload);
    return res.data.data;
  },

  async getOrders(params?: { status?: OrderStatus; date?: string }): Promise<Order[]> {
    const res = await apiClient.get<ApiResponse<Order[]>>('/api/orders', { params });
    return res.data.data;
  },

  async getOrderById(id: string): Promise<OrderDetail> {
    const res = await apiClient.get<ApiResponse<OrderDetail>>(`/api/orders/${id}`);
    return res.data.data;
  },

  async updateOrderStatus(id: string, status: OrderStatus, reason?: string): Promise<OrderDetail> {
    const res = await apiClient.patch<ApiResponse<OrderDetail>>(`/api/orders/${id}/status`, {
      status,
      reason,
    });
    return res.data.data;
  },
};
