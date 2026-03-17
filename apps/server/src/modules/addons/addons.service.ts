import { addonsRepository } from './addons.repository';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  inferMenuItemScope,
  isAddonCompatibleWithScope,
} from '../../shared/utils/addon-scope-compatibility';

export const createAddonSchema = z.object({
  name: z.string().trim().min(2, 'name obrigatorio'),
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

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

async function ensureAddonNameAvailable(name: string, excludeId?: string) {
  const target = normalizeName(name);
  const existing = await addonsRepository.listAddonNameIndex();

  const hasDuplicate = existing.some((entry) => {
    if (excludeId && entry.id === excludeId) {
      return false;
    }

    return normalizeName(entry.name) === target;
  });

  if (hasDuplicate) {
    throw new AddonsServiceError('Ja existe ingrediente com este nome', 409);
  }
}

function mapAddonPersistenceError(error: unknown): AddonsServiceError {
  if (error instanceof AddonsServiceError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new AddonsServiceError('Ja existe ingrediente com este nome', 409);
    }

    if (error.code === 'P2025') {
      return new AddonsServiceError('Ingrediente nao encontrado', 404);
    }
  }

  return new AddonsServiceError('Falha ao persistir ingrediente', 400);
}

export const addonsService = {
  listAddons: async () => addonsRepository.listActiveAddons(),

  listAllAddons: async () => addonsRepository.listAllAddons(),

  createAddon: async (payload: CreateAddonInput) => {
    try {
      await ensureAddonNameAvailable(payload.name);
      return await addonsRepository.createAddon(payload);
    } catch (error) {
      throw mapAddonPersistenceError(error);
    }
  },

  updateAddon: async (id: string, payload: UpdateAddonInput) => {
    try {
      if (payload.name) {
        await ensureAddonNameAvailable(payload.name, id);
      }

      return await addonsRepository.updateAddon(id, payload as Record<string, unknown>);
    } catch (error) {
      throw mapAddonPersistenceError(error);
    }
  },

  updateAddonStatus: async (id: string, isActive: boolean) => {
    try {
      return await addonsRepository.updateAddon(id, { isActive });
    } catch (error) {
      throw mapAddonPersistenceError(error);
    }
  },

  deleteAddon: async (id: string) => {
    try {
      return await addonsRepository.deleteAddon(id);
    } catch (error) {
      throw mapAddonPersistenceError(error);
    }
  },

  listMenuItemAddons: async (menuItemId: string) => {
    const menuItem = await addonsRepository.findMenuItemById(menuItemId);
    if (!menuItem) {
      throw new AddonsServiceError('Menu item nao encontrado', 404);
    }

    const targetScope = inferMenuItemScope(menuItem.category?.name, menuItem.name);

    const allowed = await addonsRepository.listAllowedAddonsByMenuItem(menuItemId);
    return allowed
      .filter((entry) => entry.addon.isActive)
      .filter((entry) => isAddonCompatibleWithScope(entry.addon, targetScope))
      .map((entry) => ({
        id: entry.addon.id,
        name: entry.addon.name,
        addonType: entry.addon.addonType,
        assignmentType: entry.assignmentType,
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
