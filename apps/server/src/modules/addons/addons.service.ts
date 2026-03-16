import { addonsRepository } from './addons.repository';
import { z } from 'zod';

export const createAddonSchema = z.object({
  name: z.string().min(2, 'name obrigatorio'),
  addonType: z.enum(['EXTRA', 'SUBSTITUTION', 'REMOVAL', 'SIZE_CHANGE']),
  price: z.number().min(0, 'price deve ser maior ou igual a zero'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateAddonSchema = createAddonSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo para atualizar');

export const updateAddonStatusSchema = z.object({
  isActive: z.boolean(),
});

type CreateAddonInput = z.infer<typeof createAddonSchema>;
type UpdateAddonInput = z.infer<typeof updateAddonSchema>;

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

  listAllAddons: async () => addonsRepository.listAllAddons(),

  createAddon: async (payload: CreateAddonInput) => addonsRepository.createAddon(payload),

  updateAddon: async (id: string, payload: UpdateAddonInput) =>
    addonsRepository.updateAddon(id, payload as Record<string, unknown>),

  updateAddonStatus: async (id: string, isActive: boolean) =>
    addonsRepository.updateAddon(id, { isActive }),

  deleteAddon: async (id: string) => addonsRepository.deleteAddon(id),

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
        isRequired: entry.isRequired,
      }))
      .sort((a, b) => {
        // Ordenar: primeiro required (removíveis), depois opcionais
        if (a.isRequired !== b.isRequired) {
          return b.isRequired ? 1 : -1;
        }
        return 0;
      });
  },
};
