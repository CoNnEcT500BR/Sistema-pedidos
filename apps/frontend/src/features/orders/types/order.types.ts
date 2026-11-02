export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export type FulfillmentType = 'PICKUP' | 'DELIVERY';
export type OrderPaymentMethod =
  | 'AT_COUNTER'
  | 'CASH_ON_DELIVERY'
  | 'CARD_ON_DELIVERY'
  | 'PIX_ON_DELIVERY';

export interface OrderAddon {
  id: string;
  addonId: string;
  quantity: number;
  addonPrice: number;
  subtotal: number;
  addon?: {
    id: string;
    name: string;
    addonType: string;
  };
}

export interface OrderItem {
  id: string;
  menuItemId?: string | null;
  comboId?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string | null;
  removedIngredientsJson?: string | null;
  addons: OrderAddon[];
  menuItem?: { id: string; name: string; icon?: string | null };
  combo?: { id: string; name: string; icon?: string | null };
}

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  reason?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalPrice: number;
  discount?: number;
  finalPrice?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  fulfillmentType?: FulfillmentType;
  paymentMethod?: OrderPaymentMethod;
  cashChangeFor?: number | null;
  deliveryAddress?: string | null;
  deliveryComplement?: string | null;
  deliveryReference?: string | null;
  deliveryZoneId?: string | null;
  deliveryZoneName?: string | null;
  deliveryFee?: number;
  salesChannel?: 'INTERNAL' | 'IFOOD' | '99FOOD';
  externalOrderId?: string | null;
  items?: OrderItem[];
  createdAt: string;
  completedAt?: string | null;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}
