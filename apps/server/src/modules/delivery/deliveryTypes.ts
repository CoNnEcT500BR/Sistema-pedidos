import { z } from 'zod';

export const DELIVERY_STATUS = [
  'QUEUED',
  'ASSIGNED',
  'DISPATCHED',
  'IN_ROUTE',
  'DELIVERED',
  'FAILED',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[number];

export const createCourierSchema = z.object({
  name: z.string().min(2, 'name deve ter ao menos 2 caracteres'),
  phone: z.string().optional(),
  zone: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const createRouteSchema = z.object({
  name: z.string().min(2, 'name deve ter ao menos 2 caracteres'),
  zone: z.string().min(1, 'zone obrigatoria'),
  isActive: z.boolean().default(true),
});

export const assignDeliverySchema = z.object({
  courierId: z.string().min(1, 'courierId obrigatorio'),
  routeId: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
  promisedAt: z.string().datetime().optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(DELIVERY_STATUS),
  reason: z.string().optional(),
});

export const listDeliveriesQuerySchema = z.object({
  status: z.enum(DELIVERY_STATUS).optional(),
  courierId: z.string().optional(),
  zone: z.string().optional(),
});

export type CreateCourierInput = z.infer<typeof createCourierSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type AssignDeliveryInput = z.infer<typeof assignDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type ListDeliveriesQueryInput = z.infer<typeof listDeliveriesQuerySchema>;

export interface DeliveryHistoryEntry {
  id: string;
  fromStatus: DeliveryStatus | 'SYSTEM';
  toStatus: DeliveryStatus;
  reason?: string;
  changedAt: string;
}

export interface DeliveryCourier {
  id: string;
  name: string;
  phone?: string;
  zone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  zone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryRecord {
  id: string;
  orderId: string;
  orderNumber: number;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  status: DeliveryStatus;
  priority: number;
  promisedAt?: string;
  courierId?: string;
  routeId?: string;
  createdAt: string;
  updatedAt: string;
  history: DeliveryHistoryEntry[];
}
