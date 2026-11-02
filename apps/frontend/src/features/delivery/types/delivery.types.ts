export type DeliveryStatus =
  | 'QUEUED'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'IN_ROUTE'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

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

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedMinutes: number;
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
