import { addonsRepository } from './addons.repository';

export class AddonsServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function isAddonsServiceError(error: unknown): error is AddonsServiceError {
  return error instanceof AddonsServiceError;
}

export const addonsService = {
  listAddons: async () => addonsRepository.listActiveAddons(),

  listMenuItemAddons: async (menuItemId: string) => {
    const menuItem = await addonsRepository.findMenuItemById(menuItemId);
    if (!menuItem) {
      throw new AddonsServiceError('Menu item nao encontrado', 404);
    }

    const allowed = await addonsRepository.listAllowedAddonsByMenuItem(menuItemId);
    return allowed
      .filter((entry) => entry.addon.isActive)
      .map((entry) => ({
        id: entry.addon.id,
        name: entry.addon.name,
        addonType: entry.addon.addonType,
        price: entry.addon.price,
        description: entry.addon.description,
      }));
  },
};
