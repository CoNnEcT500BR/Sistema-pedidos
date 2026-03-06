// ============ TYPES ============

// Menu
export interface ICategory {
  id: string
  name: string
  description?: string
  icon?: string
  displayOrder: number
  isActive: boolean
}

export interface IMenuItem {
  id: string
  categoryId: string
  name: string
  description?: string
  price: number
  icon?: string
  imageUrl?: string
  isAvailable: boolean
}

export interface IAddon {
  id: string
  name: string
  addonType: 'EXTRA' | 'SUBSTITUTION' | 'REMOVAL'
  price: number
  description?: string
  isActive: boolean
}

// Combos
export interface ICombo {
  id: string
  name: string
  description?: string
  price: number
  icon?: string
  isActive: boolean
}

// Orders
export interface IOrder {
  id: string
  orderNumber: number
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED'
  totalPrice: number
  discount: number
  finalPrice: number
  customerName?: string
  customerPhone?: string
  notes?: string
  createdAt: Date
  completedAt?: Date
}

export interface IOrderItem {
  id: string
  orderId: string
  menuItemId?: string
  comboId?: string
  quantity: number
  itemPrice: number
  notes?: string
}

// Users
export interface IUser {
  id: string
  email: string
  role: 'STAFF' | 'ADMIN'
  name?: string
  isActive: boolean
}

// Responses
export interface IApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface IPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
