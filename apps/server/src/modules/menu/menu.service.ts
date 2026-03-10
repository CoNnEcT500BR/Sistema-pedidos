import type { CreateMenuItemInput, UpdateMenuItemInput } from './menu.types';
import { menuRepository } from './menu.repository';

export const menuService = {
  listCategories: async () => menuRepository.listActiveCategories(),

  listMenuItems: async (categoryId?: string) => menuRepository.listMenuItems(categoryId),

  getMenuItemById: async (id: string) => {
    return menuRepository.getMenuItemById(id);
  },

  createMenuItem: async (payload: CreateMenuItemInput) => {
    return menuRepository.createMenuItem(payload);
  },

  updateMenuItem: async (id: string, payload: UpdateMenuItemInput) => {
    return menuRepository.updateMenuItem(id, payload as Record<string, unknown>);
  },

  updateAvailability: async (id: string, isAvailable: boolean) => {
    return menuRepository.updateMenuItem(id, { isAvailable });
  },

  deactivateMenuItem: async (id: string) => {
    return menuRepository.updateMenuItem(id, { isAvailable: false });
  },
};
