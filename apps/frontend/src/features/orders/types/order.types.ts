export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

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
  items?: OrderItem[];
  createdAt: string;
  completedAt?: string | null;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}
