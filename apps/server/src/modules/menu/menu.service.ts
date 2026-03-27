import type {
  CreateCategoryInput,
  CreateMenuItemInput,
  ReorderMenuItemsInput,
  UpdateCategoryInput,
  UpdateMenuItemInput,
} from './menu.types';
import { menuRepository } from './menu.repository';
import {
  inferMenuItemScope,
  isNamedAsExtra,
  isAddonCompatibleWithScope,
  type ProductScope,
} from '../../shared/utils/addon-scope-compatibility';

type AddonCompatibilityInput = {
  id: string;
  name: string;
  addonType: string;
  description?: string | null;
};

type NormalizedAddonPayload = {
  addonIds: string[];
  assemblyAddonIds?: string[];
  breadAddonIds?: string[];
  extraAddonIds?: string[];
  usedSegmentedInput: boolean;
};

export class MenuServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function isMenuServiceError(error: unknown): error is MenuServiceError {
  return error instanceof MenuServiceError;
}

function ensureHydratedAddonsMatch(addonIds: string[], hydrated: AddonCompatibilityInput[]) {
  if (addonIds.length !== hydrated.length) {
    throw new MenuServiceError('Um ou mais adicionais informados nao existem', 400);
  }
}

function validateAddonCompatibility(params: {
  targetScope: ProductScope;
  hydratedAddons: AddonCompatibilityInput[];
}) {
  const { targetScope, hydratedAddons } = params;

  if (!hydratedAddons.length) return;

  const incompatible = hydratedAddons.filter(
    (addon) => !isAddonCompatibleWithScope(addon, targetScope),
  );
  if (incompatible.length) {
    const hasExtraInBuild =
      targetScope === 'BURGER_BUILD' && incompatible.some((addon) => addon.addonType === 'EXTRA');
    const hasSizeChangeInBuild =
      targetScope === 'BURGER_BUILD' &&
      incompatible.some((addon) => addon.addonType === 'SIZE_CHANGE');
    const hasNamedExtraInBuild =
      targetScope === 'BURGER_BUILD' && incompatible.some((addon) => isNamedAsExtra(addon.name));

    if (hasExtraInBuild || hasNamedExtraInBuild) {
      throw new MenuServiceError(
        'Regra de operacao: itens de criacao de hamburguer nao aceitam adicionais do tipo EXTRA',
        400,
      );
    }

    if (hasSizeChangeInBuild) {
      throw new MenuServiceError(
        'Regra de operacao: itens de criacao de hamburguer nao aceitam adicionais do tipo SIZE_CHANGE',
        400,
      );
    }

    throw new MenuServiceError('Existem adicionais incompativeis com o conjunto do item', 400);
  }
}

async function ensureDisplayOrderAvailable(
  categoryId: string,
  displayOrder: number,
  excludeId?: string,
) {
  const existing = await menuRepository.findMenuItemByCategoryAndDisplayOrder(
    categoryId,
    displayOrder,
    excludeId,
  );

  if (existing) {
    throw new MenuServiceError('Ja existe item com esta ordem nesta categoria', 400);
  }
}

function normalizeAddonPayload(payload: {
  addonIds?: string[];
  assemblyAddonIds?: string[];
  breadAddonIds?: string[];
  extraAddonIds?: string[];
}): NormalizedAddonPayload {
  const hasSegmentedInput =
    Array.isArray(payload.assemblyAddonIds) ||
    Array.isArray(payload.breadAddonIds) ||
    Array.isArray(payload.extraAddonIds);

  if (!hasSegmentedInput) {
    return {
      addonIds: payload.addonIds ?? [],
      usedSegmentedInput: false,
    };
  }

  const assemblyAddonIds = payload.assemblyAddonIds ?? [];
  const breadAddonIds = payload.breadAddonIds ?? [];
  const extraAddonIds = payload.extraAddonIds ?? [];

  return {
    addonIds: [...assemblyAddonIds, ...breadAddonIds, ...extraAddonIds],
    assemblyAddonIds,
    breadAddonIds,
    extraAddonIds,
    usedSegmentedInput: true,
  };
}

function validateSegmentedAssignment(params: {
  targetScope: ProductScope;
  extraAddonIds: string[];
}) {
  if (params.targetScope === 'BURGER_BUILD' && params.extraAddonIds.length > 0) {
    throw new MenuServiceError(
      'Regra de operacao: itens de criacao de hamburguer nao aceitam extras',
      400,
    );
  }
}

export const menuService = {
  listCategories: async () => menuRepository.listActiveCategories(),

  listAllCategories: async () => menuRepository.listAllCategories(),

  createCategory: async (payload: CreateCategoryInput) => menuRepository.createCategory(payload),

  updateCategory: async (id: string, payload: UpdateCategoryInput) => {
    return menuRepository.updateCategory(id, payload as Record<string, unknown>);
  },

  updateCategoryStatus: async (id: string, isActive: boolean) => {
    return menuRepository.updateCategory(id, { isActive });
  },

  deleteCategory: async (id: string) => {
    return menuRepository.deleteCategory(id);
  },

  listMenuItems: async (categoryId?: string) => menuRepository.listMenuItems(categoryId),

  listAdminMenuItems: async (categoryId?: string) => menuRepository.listAdminMenuItems(categoryId),

  getMenuItemById: async (id: string) => {
    return menuRepository.getMenuItemById(id);
  },

  createMenuItem: async (payload: CreateMenuItemInput) => {
    const normalizedAddons = normalizeAddonPayload(payload);
    const nextDisplayOrder =
      payload.displayOrder ??
      (await menuRepository.getLastDisplayOrderByCategory(payload.categoryId)) + 1;

    const shouldValidateScope =
      normalizedAddons.usedSegmentedInput || normalizedAddons.addonIds.length > 0;
    const targetCategory = shouldValidateScope
      ? await menuRepository.findCategoryById(payload.categoryId)
      : null;
    if (shouldValidateScope && !targetCategory) {
      throw new MenuServiceError('Categoria nao encontrada', 404);
    }
    const targetScope = targetCategory
      ? inferMenuItemScope(targetCategory.name, payload.name)
      : ('GENERAL' as ProductScope);

    await ensureDisplayOrderAvailable(payload.categoryId, nextDisplayOrder);
    if (normalizedAddons.usedSegmentedInput) {
      validateSegmentedAssignment({
        targetScope,
        extraAddonIds: normalizedAddons.extraAddonIds ?? [],
      });
    }

    const hydratedAddons = normalizedAddons.addonIds.length
      ? await menuRepository.findAddonsByIds(normalizedAddons.addonIds)
      : [];
    if (normalizedAddons.addonIds.length) {
      ensureHydratedAddonsMatch(normalizedAddons.addonIds, hydratedAddons);
      validateAddonCompatibility({
        targetScope,
        hydratedAddons,
      });
    }

    let inferredAssemblyAddonIds = normalizedAddons.assemblyAddonIds;
    let inferredBreadAddonIds = normalizedAddons.breadAddonIds;
    let inferredExtraAddonIds = normalizedAddons.extraAddonIds;
    if (!normalizedAddons.usedSegmentedInput && hydratedAddons.length) {
      inferredExtraAddonIds = hydratedAddons
        .filter((addon) => addon.addonType === 'EXTRA')
        .map((addon) => addon.id);
      inferredAssemblyAddonIds = hydratedAddons
        .filter((addon) => addon.addonType !== 'EXTRA')
        .map((addon) => addon.id);
      inferredBreadAddonIds = [];
    }

    return menuRepository.createMenuItem({
      ...payload,
      displayOrder: nextDisplayOrder,
      addonIds: undefined,
      assemblyAddonIds: inferredAssemblyAddonIds,
      breadAddonIds: inferredBreadAddonIds,
      extraAddonIds: inferredExtraAddonIds,
    });
  },

  updateMenuItem: async (id: string, payload: UpdateMenuItemInput) => {
    const current = await menuRepository.getMenuItemBasicById(id);
    if (!current) {
      throw new MenuServiceError('Item nao encontrado', 404);
    }

    const targetCategoryId = payload.categoryId ?? current.categoryId;
    const targetDisplayOrder = payload.displayOrder ?? current.displayOrder;

    if (targetCategoryId !== current.categoryId || targetDisplayOrder !== current.displayOrder) {
      await ensureDisplayOrderAvailable(targetCategoryId, targetDisplayOrder, id);
    }

    const targetName = payload.name ?? current.name;

    const normalizedAddons = normalizeAddonPayload(payload);

    const shouldValidateUsingScope =
      normalizedAddons.usedSegmentedInput ||
      Array.isArray(payload.addonIds) ||
      Boolean(payload.categoryId || payload.name);
    const targetCategory = shouldValidateUsingScope
      ? await menuRepository.findCategoryById(targetCategoryId)
      : null;
    if (shouldValidateUsingScope && !targetCategory) {
      throw new MenuServiceError('Categoria nao encontrada', 404);
    }
    const targetScope = targetCategory
      ? inferMenuItemScope(targetCategory.name, targetName)
      : ('GENERAL' as ProductScope);

    const hydratedPayloadAddons = normalizedAddons.addonIds.length
      ? await menuRepository.findAddonsByIds(normalizedAddons.addonIds)
      : [];
    if (normalizedAddons.addonIds.length) {
      ensureHydratedAddonsMatch(normalizedAddons.addonIds, hydratedPayloadAddons);
    }

    if (normalizedAddons.usedSegmentedInput) {
      validateSegmentedAssignment({
        targetScope,
        extraAddonIds: normalizedAddons.extraAddonIds ?? [],
      });
    }

    if (normalizedAddons.usedSegmentedInput || Array.isArray(payload.addonIds)) {
      validateAddonCompatibility({
        targetScope,
        hydratedAddons: hydratedPayloadAddons,
      });
    } else if (payload.categoryId || payload.name) {
      const detail = await menuRepository.getMenuItemById(id);
      if (detail) {
        validateAddonCompatibility({
          targetScope,
          hydratedAddons: detail.addons.map((entry) => ({
            id: entry.addon.id,
            name: entry.addon.name,
            addonType: entry.addon.addonType,
            description: entry.addon.description,
          })),
        });
      }
    }

    let inferredAssemblyAddonIds = normalizedAddons.assemblyAddonIds;
    let inferredBreadAddonIds = normalizedAddons.breadAddonIds;
    let inferredExtraAddonIds = normalizedAddons.extraAddonIds;
    if (!normalizedAddons.usedSegmentedInput && hydratedPayloadAddons.length) {
      inferredExtraAddonIds = hydratedPayloadAddons
        .filter((addon) => addon.addonType === 'EXTRA')
        .map((addon) => addon.id);
      inferredAssemblyAddonIds = hydratedPayloadAddons
        .filter((addon) => addon.addonType !== 'EXTRA')
        .map((addon) => addon.id);
      inferredBreadAddonIds = [];
    }

    return menuRepository.updateMenuItem(id, {
      ...(payload as Record<string, unknown>),
      addonIds: normalizedAddons.usedSegmentedInput ? undefined : payload.addonIds,
      assemblyAddonIds:
        normalizedAddons.usedSegmentedInput || Array.isArray(payload.addonIds)
          ? inferredAssemblyAddonIds
          : undefined,
      breadAddonIds:
        normalizedAddons.usedSegmentedInput || Array.isArray(payload.addonIds)
          ? inferredBreadAddonIds
          : undefined,
      extraAddonIds:
        normalizedAddons.usedSegmentedInput || Array.isArray(payload.addonIds)
          ? inferredExtraAddonIds
          : undefined,
    });
  },

  updateAvailability: async (id: string, isAvailable: boolean) => {
    return menuRepository.updateMenuItem(id, { isAvailable });
  },

  deactivateMenuItem: async (id: string) => {
    return menuRepository.updateMenuItem(id, { isAvailable: false });
  },

  deleteMenuItem: async (id: string) => {
    return menuRepository.deleteMenuItem(id);
  },

  reorderMenuItems: async (payload: ReorderMenuItemsInput) => {
    const category = await menuRepository.findCategoryById(payload.categoryId);
    if (!category) {
      throw new MenuServiceError('Categoria nao encontrada', 404);
    }

    const current = await menuRepository.listMenuItemIdsByCategory(payload.categoryId);
    if (current.length !== payload.orderedItemIds.length) {
      throw new MenuServiceError('Lista de ordenacao invalida para esta categoria', 400);
    }

    const currentIds = new Set(current.map((item) => item.id));
    const hasUnknown = payload.orderedItemIds.some((id) => !currentIds.has(id));
    if (hasUnknown) {
      throw new MenuServiceError('Lista de ordenacao invalida para esta categoria', 400);
    }

    await menuRepository.reorderMenuItemsByCategory(payload.categoryId, payload.orderedItemIds);
  },
};
