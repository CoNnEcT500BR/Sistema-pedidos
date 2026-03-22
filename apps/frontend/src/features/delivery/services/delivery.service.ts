import { apiClient } from '@/services/api.service';
import type {
  DeliveryCourier,
  DeliveryRecord,
  DeliveryRoute,
  DeliveryStatus,
} from '../types/delivery.types';

interface ApiResponse<T> {
  data: T;
}

export const deliveryService = {
  async syncReadyOrdersToQueue(): Promise<DeliveryRecord[]> {
    const res = await apiClient.post<ApiResponse<DeliveryRecord[]>>(
      '/api/delivery/queue/from-ready',
    );
    return res.data.data;
  },

  async getQueue(params?: {
    status?: DeliveryStatus;
    courierId?: string;
    zone?: string;
  }): Promise<DeliveryRecord[]> {
    const res = await apiClient.get<ApiResponse<DeliveryRecord[]>>('/api/delivery/queue', {
      params,
    });
    return res.data.data;
  },

  async getCouriers(): Promise<DeliveryCourier[]> {
    const res = await apiClient.get<ApiResponse<DeliveryCourier[]>>('/api/delivery/couriers');
    return res.data.data;
  },

  async createCourier(payload: {
    name: string;
    phone?: string;
    zone?: string;
    isActive?: boolean;
  }): Promise<DeliveryCourier> {
    const res = await apiClient.post<ApiResponse<DeliveryCourier>>(
      '/api/delivery/couriers',
      payload,
    );
    return res.data.data;
  },

  async getRoutes(): Promise<DeliveryRoute[]> {
    const res = await apiClient.get<ApiResponse<DeliveryRoute[]>>('/api/delivery/routes');
    return res.data.data;
  },

  async createRoute(payload: {
    name: string;
    zone: string;
    isActive?: boolean;
  }): Promise<DeliveryRoute> {
    const res = await apiClient.post<ApiResponse<DeliveryRoute>>('/api/delivery/routes', payload);
    return res.data.data;
  },

  async assignDelivery(
    id: string,
    payload: {
      courierId: string;
      routeId?: string;
      priority?: number;
      promisedAt?: string;
    },
  ): Promise<DeliveryRecord> {
    const res = await apiClient.patch<ApiResponse<DeliveryRecord>>(
      `/api/delivery/${id}/assign`,
      payload,
    );
    return res.data.data;
  },

  async updateStatus(id: string, status: DeliveryStatus, reason?: string): Promise<DeliveryRecord> {
    const res = await apiClient.patch<ApiResponse<DeliveryRecord>>(`/api/delivery/${id}/status`, {
      status,
      reason,
    });
    return res.data.data;
  },
};
