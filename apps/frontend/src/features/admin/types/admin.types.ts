import type { Addon, Category, Combo, MenuItem } from '@/features/menu/types/menu.types';

export interface AdminMenuItemDetail extends MenuItem {
  category: Category;
  addons: Array<{
    id: string;
    menuItemId: string;
    addonId: string;
    isRequired: boolean;
    assignmentType: 'ASSEMBLY' | 'EXTRA';
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
  description?: string;
  isActive?: boolean;
}

export type AdminComboDetail = Combo;
