import type { Addon, Category, Combo, MenuItem } from '@/features/menu/types/menu.types';
import { apiClient } from '@/services/api.service';
import type {
  AdminAddonPayload,
  AdminCategoryPayload,
  AdminComboPayload,
  AdminMenuItemDetail,
  AdminMenuItemPayload,
  AdminUser,
  AdminUserPayload,
  DashboardData,
  SalesReportData,
} from '../types/admin.types';

interface ApiResponse<T> {
  data: T;
}

export const adminService = {
  async getDashboard(params?: { startDate?: string; endDate?: string }): Promise<DashboardData> {
    const res = await apiClient.get<ApiResponse<DashboardData>>('/api/reports/dashboard', {
      params,
    });
    return res.data.data;
  },

  async getSalesReport(params: { startDate?: string; endDate?: string }): Promise<SalesReportData> {
    const res = await apiClient.get<ApiResponse<SalesReportData>>('/api/reports/sales', { params });
    return res.data.data;
  },

  async getAdminCategories(): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>('/api/admin/categories');
    return res.data.data;
  },

  async createCategory(payload: AdminCategoryPayload): Promise<Category> {
    const res = await apiClient.post<ApiResponse<Category>>('/api/admin/categories', payload);
    return res.data.data;
  },

  async updateCategory(id: string, payload: Partial<AdminCategoryPayload>): Promise<Category> {
    const res = await apiClient.put<ApiResponse<Category>>(`/api/admin/categories/${id}`, payload);
    return res.data.data;
  },

  async updateCategoryStatus(id: string, isActive: boolean): Promise<Category> {
    const res = await apiClient.patch<ApiResponse<Category>>(`/api/admin/categories/${id}/status`, {
      isActive,
    });
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<Category> {
    const res = await apiClient.delete<ApiResponse<Category>>(`/api/admin/categories/${id}`);
    return res.data.data;
  },

  async getAdminMenuItems(categoryId?: string): Promise<MenuItem[]> {
    const res = await apiClient.get<ApiResponse<MenuItem[]>>('/api/admin/menu', {
      params: categoryId ? { category: categoryId } : undefined,
    });
    return res.data.data;
  },

  async reorderAdminMenuItems(categoryId: string, orderedItemIds: string[]): Promise<void> {
    await apiClient.post<ApiResponse<{ success: boolean }>>('/api/admin/menu/reorder', {
      categoryId,
      orderedItemIds,
    });
  },

  async getMenuItemDetail(id: string): Promise<AdminMenuItemDetail> {
    const res = await apiClient.get<ApiResponse<AdminMenuItemDetail>>(`/api/menu/${id}`);
    return res.data.data;
  },

  async createMenuItem(payload: AdminMenuItemPayload): Promise<AdminMenuItemDetail> {
    const res = await apiClient.post<ApiResponse<AdminMenuItemDetail>>('/api/menu', payload);
    return res.data.data;
  },

  async updateMenuItem(
    id: string,
    payload: Partial<AdminMenuItemPayload>,
  ): Promise<AdminMenuItemDetail> {
    const res = await apiClient.put<ApiResponse<AdminMenuItemDetail>>(`/api/menu/${id}`, payload);
    return res.data.data;
  },

  async updateMenuItemAvailability(id: string, isAvailable: boolean): Promise<AdminMenuItemDetail> {
    const res = await apiClient.patch<ApiResponse<AdminMenuItemDetail>>(
      `/api/menu/${id}/availability`,
      {
        isAvailable,
      },
    );
    return res.data.data;
  },

  async deactivateMenuItem(id: string): Promise<AdminMenuItemDetail> {
    const res = await apiClient.delete<ApiResponse<AdminMenuItemDetail>>(`/api/menu/${id}`);
    return res.data.data;
  },

  async deleteMenuItem(id: string): Promise<AdminMenuItemDetail> {
    const res = await apiClient.delete<ApiResponse<AdminMenuItemDetail>>(`/api/admin/menu/${id}`);
    return res.data.data;
  },

  async getAllAddons(): Promise<Addon[]> {
    const res = await apiClient.get<ApiResponse<Addon[]>>('/api/addons');
    return res.data.data;
  },

  async getAdminAddons(): Promise<Addon[]> {
    const res = await apiClient.get<ApiResponse<Addon[]>>('/api/admin/addons');
    return res.data.data;
  },

  async createAddon(payload: AdminAddonPayload): Promise<Addon> {
    const res = await apiClient.post<ApiResponse<Addon>>('/api/admin/addons', payload);
    return res.data.data;
  },

  async updateAddon(id: string, payload: Partial<AdminAddonPayload>): Promise<Addon> {
    const res = await apiClient.put<ApiResponse<Addon>>(`/api/admin/addons/${id}`, payload);
    return res.data.data;
  },

  async updateAddonStatus(id: string, isActive: boolean): Promise<Addon> {
    const res = await apiClient.patch<ApiResponse<Addon>>(`/api/admin/addons/${id}/status`, {
      isActive,
    });
    return res.data.data;
  },

  async deleteAddon(id: string): Promise<Addon> {
    const res = await apiClient.delete<ApiResponse<Addon>>(`/api/admin/addons/${id}`);
    return res.data.data;
  },

  async getAdminCombos(): Promise<Combo[]> {
    const res = await apiClient.get<ApiResponse<Combo[]>>('/api/admin/combos');
    return res.data.data;
  },

  async createCombo(payload: AdminComboPayload): Promise<Combo> {
    const res = await apiClient.post<ApiResponse<Combo>>('/api/combos', payload);
    return res.data.data;
  },

  async updateCombo(id: string, payload: Partial<AdminComboPayload>): Promise<Combo> {
    const res = await apiClient.put<ApiResponse<Combo>>(`/api/combos/${id}`, payload);
    return res.data.data;
  },

  async updateComboAvailability(id: string, isAvailable: boolean): Promise<Combo> {
    const res = await apiClient.patch<ApiResponse<Combo>>(`/api/combos/${id}/availability`, {
      isAvailable,
    });
    return res.data.data;
  },

  async deleteCombo(id: string): Promise<Combo> {
    const res = await apiClient.delete<ApiResponse<Combo>>(`/api/combos/${id}`);
    return res.data.data;
  },

  async getUsers(): Promise<AdminUser[]> {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/api/users');
    return res.data.data;
  },

  async createUser(
    payload: Required<Pick<AdminUserPayload, 'email' | 'password' | 'role'>> & AdminUserPayload,
  ): Promise<AdminUser> {
    const res = await apiClient.post<ApiResponse<AdminUser>>('/api/users', payload);
    return res.data.data;
  },

  async updateUser(id: string, payload: AdminUserPayload): Promise<AdminUser> {
    const res = await apiClient.put<ApiResponse<AdminUser>>(`/api/users/${id}`, payload);
    return res.data.data;
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<AdminUser> {
    const res = await apiClient.patch<ApiResponse<AdminUser>>(`/api/users/${id}/status`, {
      isActive,
    });
    return res.data.data;
  },

  async deleteUser(id: string): Promise<AdminUser> {
    const res = await apiClient.delete<ApiResponse<AdminUser>>(`/api/users/${id}`);
    return res.data.data;
  },
};
