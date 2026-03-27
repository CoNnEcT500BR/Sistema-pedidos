import type { Addon } from '@/features/menu/types/menu.types';

export type KitchenStation =
  | 'PROTEINS'
  | 'CHEESES'
  | 'VEGETABLES'
  | 'SAUCES'
  | 'DRINKS'
  | 'SIDES'
  | 'FINISHING'
  | 'GENERAL';

export type ProductScope = 'BURGER' | 'BURGER_BUILD' | 'DRINK' | 'SIDE' | 'COMBO' | 'GENERAL';

export type IngredientPriority = 'FAST' | 'MEDIUM' | 'CRITICAL';

export interface IngredientMeta {
  station: KitchenStation;
  scope: ProductScope;
  priority: IngredientPriority;
}

const defaultMeta: IngredientMeta = {
  station: 'GENERAL',
  scope: 'GENERAL',
  priority: 'FAST',
};

const ingredientMetaCache = new Map<string, IngredientMeta>();

function getAddonMetaCacheKey(addon: Addon): string {
  return `${addon.id}|${addon.name}|${addon.addonType}|${addon.station ?? ''}|${addon.scope ?? ''}|${addon.priority ?? ''}|${addon.description ?? ''}`;
}

function asStation(value: string | undefined): KitchenStation | null {
  if (!value) return null;
  const allowed: KitchenStation[] = [
    'PROTEINS',
    'CHEESES',
    'VEGETABLES',
    'SAUCES',
    'DRINKS',
    'SIDES',
    'FINISHING',
    'GENERAL',
  ];
  return allowed.includes(value as KitchenStation) ? (value as KitchenStation) : null;
}

function asScope(value: string | undefined): ProductScope | null {
  if (!value) return null;
  const allowed: ProductScope[] = ['BURGER', 'BURGER_BUILD', 'DRINK', 'SIDE', 'COMBO', 'GENERAL'];
  return allowed.includes(value as ProductScope) ? (value as ProductScope) : null;
}

function asPriority(value: string | undefined): IngredientPriority | null {
  if (!value) return null;
  const allowed: IngredientPriority[] = ['FAST', 'MEDIUM', 'CRITICAL'];
  return allowed.includes(value as IngredientPriority) ? (value as IngredientPriority) : null;
}

export function resolveIngredientMeta(addon: Addon): IngredientMeta {
  const cacheKey = getAddonMetaCacheKey(addon);
  const cached = ingredientMetaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const station = asStation(addon.station) ?? defaultMeta.station;
  const scope = asScope(addon.scope) ?? defaultMeta.scope;
  const priority = asPriority(addon.priority) ?? defaultMeta.priority;

  const meta: IngredientMeta = { station, scope, priority };
  ingredientMetaCache.set(cacheKey, meta);
  return meta;
}

export function defaultIngredientMeta(): IngredientMeta {
  return { ...defaultMeta };
}
