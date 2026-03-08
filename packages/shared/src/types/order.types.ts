export interface IOrder {
  id: string;
  orderNumber: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  totalPrice: number;
  discount: number;
  finalPrice: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  menuItemId?: string;
  comboId?: string;
  quantity: number;
  itemPrice: number;
  notes?: string;
}
