import { apiClient } from '@/services/api.service';
import type { Addon, Category, Combo, MenuItem } from '../types/menu.types';

interface ApiResponse<T> {
  data: T;
}

export const menuService = {
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>('/api/categories');
    return res.data.data;
  },

  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    const params = categoryId ? { category: categoryId } : {};
    const res = await apiClient.get<ApiResponse<MenuItem[]>>('/api/menu', { params });
    return res.data.data;
  },

  async getMenuItem(id: string): Promise<MenuItem> {
    const res = await apiClient.get<ApiResponse<MenuItem>>(`/api/menu/${id}`);
    return res.data.data;
  },

  async getAddons(menuItemId: string): Promise<Addon[]> {
    const res = await apiClient.get<ApiResponse<Addon[]>>(`/api/menu/${menuItemId}/addons`);
    return res.data.data;
  },

  async getAllAddons(): Promise<Addon[]> {
    const res = await apiClient.get<ApiResponse<Addon[]>>('/api/addons');
    return res.data.data;
  },

  async getCombos(): Promise<Combo[]> {
    const res = await apiClient.get<ApiResponse<Combo[]>>('/api/combos');
    return res.data.data;
  },
};
