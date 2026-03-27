import type { Addon, Category, Combo, MenuItem } from '@/features/menu/types/menu.types';

export interface AdminMenuItemDetail extends MenuItem {
  category: Category;
  addons: Array<{
    id: string;
    menuItemId: string;
    addonId: string;
    isRequired: boolean;
    assignmentType: 'ASSEMBLY' | 'BREAD' | 'EXTRA';
    displayOrder: number;
    addon: Addon;
  }>;
}

export interface DashboardMetricGroup {
  grossSales: number;
  ordersCount: number;
  averageTicket: number;
}

export interface DashboardBreakdownItem {
  name: string;
  quantity: number;
  revenue: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: number;
  status: string;
  customerName?: string | null;
  finalPrice: number;
  createdAt: string;
}

export interface DashboardData {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  totals: DashboardMetricGroup;
  statusBreakdown: Record<string, number>;
  topItems: DashboardBreakdownItem[];
  salesByCategory: DashboardBreakdownItem[];
  recentOrders: DashboardRecentOrder[];
}

export interface SalesReportData extends DashboardData {
  dailyTotals: Array<{
    date: string;
    total: number;
    orders: number;
  }>;
  exportGeneratedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  name?: string | null;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  timestamp: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  entity: string;
  action: string;
  payload?: Record<string, unknown> | string;
}

export type AdminAuditSortOrder = 'newest' | 'oldest';

export interface AdminAuditLogsPage {
  items: AdminAuditLog[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
}

export interface AdminMenuItemPayload {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  icon?: string;
  imageUrl?: string;
  displayOrder?: number;
  isAvailable?: boolean;
  addonIds?: string[];
  assemblyAddonIds?: string[];
  breadAddonIds?: string[];
  extraAddonIds?: string[];
}

export interface AdminComboPayload {
  name: string;
  description?: string;
  price: number;
  icon?: string;
  displayOrder?: number;
  comboItems: Array<{
    menuItemId: string;
    quantity: number;
  }>;
}

export interface AdminUserPayload {
  email: string;
  password?: string;
  role: 'ADMIN' | 'STAFF';
  name?: string;
  isActive?: boolean;
}

export interface AdminCategoryPayload {
  name: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface AdminAddonPayload {
  name: string;
  addonType: 'EXTRA' | 'SUBSTITUTION' | 'REMOVAL' | 'SIZE_CHANGE';
  price: number;
  scope?: 'BURGER' | 'BURGER_BUILD' | 'DRINK' | 'SIDE' | 'COMBO' | 'GENERAL';
  station?:
    | 'PROTEINS'
    | 'CHEESES'
    | 'VEGETABLES'
    | 'SAUCES'
    | 'DRINKS'
    | 'SIDES'
    | 'FINISHING'
    | 'GENERAL';
  priority?: 'FAST' | 'MEDIUM' | 'CRITICAL';
  description?: string;
  isActive?: boolean;
}

export type AdminComboDetail = Combo;
