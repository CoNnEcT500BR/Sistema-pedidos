import { z } from 'zod';

export const DELIVERY_STATUS = [
  'QUEUED',
  'ASSIGNED',
  'DISPATCHED',
  'IN_ROUTE',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS)[number];

export const allowedDeliveryStatusTransitions: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  QUEUED: ['ASSIGNED'],
  ASSIGNED: ['QUEUED', 'DISPATCHED'],
  DISPATCHED: ['IN_ROUTE', 'FAILED'],
  IN_ROUTE: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['QUEUED', 'ASSIGNED'],
  CANCELLED: [],
};

export function isAllowedDeliveryStatusTransition(
  currentStatus: DeliveryStatus,
  nextStatus: DeliveryStatus,
): boolean {
  return allowedDeliveryStatusTransitions[currentStatus].includes(nextStatus);
}

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

export const createDeliveryZoneSchema = z.object({
  name: z.string().trim().min(2, 'name deve ter ao menos 2 caracteres').max(80),
  fee: z.number().min(0).max(9999.99),
  estimatedMinutes: z.number().int().min(5).max(300),
  isActive: z.boolean().default(true),
});

export const updateDeliveryZoneSchema = createDeliveryZoneSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  'Informe ao menos um campo para atualizar',
);

export type CreateCourierInput = z.infer<typeof createCourierSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>;
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>;
export type AssignDeliveryInput = z.infer<typeof assignDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type ListDeliveriesQueryInput = z.infer<typeof listDeliveriesQuerySchema>;

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  orderStatus: string;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string | null;
  deliveryComplement?: string | null;
  deliveryReference?: string | null;
  deliveryZoneName?: string | null;
  deliveryFee: number;
  paymentMethod: string;
  cashChangeFor?: number | null;
  finalPrice: number;
  status: DeliveryStatus;
  priority: number;
  promisedAt?: string;
  courierId?: string;
  routeId?: string;
  createdAt: string;
  updatedAt: string;
  history: DeliveryHistoryEntry[];
}
