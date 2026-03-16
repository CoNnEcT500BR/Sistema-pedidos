import type {
  CreateCategoryInput,
  CreateMenuItemInput,
  UpdateCategoryInput,
  UpdateMenuItemInput,
} from './menu.types';
import { menuRepository } from './menu.repository';

type ProductScope = 'BURGER' | 'BURGER_BUILD' | 'DRINK' | 'SIDE' | 'COMBO' | 'GENERAL';

type AddonCompatibilityInput = {
  id: string;
  name: string;
  addonType: string;
  description?: string | null;
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

function normalizeScopeSource(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferMenuItemScope(categoryName?: string | null, itemName?: string | null): ProductScope {
  const value = normalizeScopeSource(`${categoryName ?? ''} ${itemName ?? ''}`);

  if (
    /(criacao|criar|monte|personaliz|custom)/.test(value) &&
    /(hamburg|burger|lanche|sanduiche)/.test(value)
  ) {
    return 'BURGER_BUILD';
  }
  if (/(bebida|refrigerante|suco|agua|cha|milkshake)/.test(value)) return 'DRINK';
  if (/(acompanhamento|batata|nugget|onion|side)/.test(value)) return 'SIDE';
  if (/(combo)/.test(value)) return 'COMBO';
  if (/(hamburg|burger|lanche|sanduiche)/.test(value)) return 'BURGER';

  return 'GENERAL';
}

function parseScopeFromMeta(description?: string | null): ProductScope | null {
  if (!description) return null;

  const tokenMatch = description.match(/\[meta\|([^\]]*)\]/i);
  if (!tokenMatch?.[1]) return null;

  const segments = tokenMatch[1].split('|');
  const scopeSegment = segments.find((segment) =>
    segment.trim().toLowerCase().startsWith('scope='),
  );
  if (!scopeSegment) return null;

  const [, rawScope] = scopeSegment.split('=');
  const normalized = (rawScope ?? '').trim().toUpperCase();
  const allowed: ProductScope[] = ['BURGER', 'BURGER_BUILD', 'DRINK', 'SIDE', 'COMBO', 'GENERAL'];
  return allowed.includes(normalized as ProductScope) ? (normalized as ProductScope) : null;
}

function inferAddonScope(
  addon: Pick<AddonCompatibilityInput, 'name' | 'description'>,
): ProductScope {
  const scopeFromMeta = parseScopeFromMeta(addon.description);
  if (scopeFromMeta) return scopeFromMeta;

  const value = normalizeScopeSource(`${addon.name} ${addon.description ?? ''}`);

  if (/(refrigerante|suco|agua|cha|milkshake|bebida|sabor|gelo)/.test(value)) return 'DRINK';
  if (/(batata|nugget|onion|acompanhamento)/.test(value)) return 'SIDE';
  if (/(upgrade|combo)/.test(value)) return 'COMBO';
  if (/(pao|blend|montagem|base do lanche|criacao burger)/.test(value)) return 'BURGER_BUILD';
  if (/(carne|frango|bacon|queijo|alface|tomate|cebola|picles|molho|hamburg)/.test(value)) {
    return 'BURGER';
  }

  return 'GENERAL';
}

function isAddonCompatibleWithScope(addon: AddonCompatibilityInput, scope: ProductScope): boolean {
  const addonScope = inferAddonScope(addon);

  if (
    scope === 'BURGER_BUILD' &&
    (addon.addonType === 'EXTRA' || addon.addonType === 'SIZE_CHANGE')
  ) {
    return false;
  }
  if (addonScope === 'GENERAL' || scope === 'GENERAL') return true;
  if (scope === 'BURGER_BUILD') return addonScope === 'BURGER_BUILD' || addonScope === 'BURGER';

  return addonScope === scope;
}

async function validateAddonCompatibility(params: {
  categoryId: string;
  itemName: string;
  addonIds?: string[];
  hydratedAddons?: AddonCompatibilityInput[];
}) {
  const addonIds = params.addonIds ?? [];
  const hydrated = params.hydratedAddons ?? [];

  if (!addonIds.length && !hydrated.length) return;

  const category = await menuRepository.findCategoryById(params.categoryId);
  if (!category) {
    throw new MenuServiceError('Categoria nao encontrada', 404);
  }

  const targetScope = inferMenuItemScope(category.name, params.itemName);
  const addons = hydrated.length ? hydrated : await menuRepository.findAddonsByIds(addonIds);

  if (!hydrated.length && addons.length !== addonIds.length) {
    throw new MenuServiceError('Um ou mais adicionais informados nao existem', 400);
  }

  const incompatible = addons.filter((addon) => !isAddonCompatibleWithScope(addon, targetScope));
  if (incompatible.length) {
    const hasExtraInBuild =
      targetScope === 'BURGER_BUILD' && incompatible.some((addon) => addon.addonType === 'EXTRA');
    const hasSizeChangeInBuild =
      targetScope === 'BURGER_BUILD' &&
      incompatible.some((addon) => addon.addonType === 'SIZE_CHANGE');

    if (hasExtraInBuild) {
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
    const nextDisplayOrder =
      payload.displayOrder ??
      (await menuRepository.getLastDisplayOrderByCategory(payload.categoryId)) + 1;

    await ensureDisplayOrderAvailable(payload.categoryId, nextDisplayOrder);
    await validateAddonCompatibility({
      categoryId: payload.categoryId,
      itemName: payload.name,
      addonIds: payload.addonIds,
    });

    return menuRepository.createMenuItem({
      ...payload,
      displayOrder: nextDisplayOrder,
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

    if (Array.isArray(payload.addonIds)) {
      await validateAddonCompatibility({
        categoryId: targetCategoryId,
        itemName: targetName,
        addonIds: payload.addonIds,
      });
    } else if (payload.categoryId || payload.name) {
      const detail = await menuRepository.getMenuItemById(id);
      if (detail) {
        await validateAddonCompatibility({
          categoryId: targetCategoryId,
          itemName: targetName,
          hydratedAddons: detail.addons.map((entry) => ({
            id: entry.addon.id,
            name: entry.addon.name,
            addonType: entry.addon.addonType,
            description: entry.addon.description,
          })),
        });
      }
    }

    return menuRepository.updateMenuItem(id, payload as Record<string, unknown>);
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
};
