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

const META_PREFIX = '[meta|';
const META_SUFFIX = ']';

const defaultMeta: IngredientMeta = {
  station: 'GENERAL',
  scope: 'GENERAL',
  priority: 'FAST',
};

const ingredientMetaCache = new Map<string, IngredientMeta>();

function getAddonMetaCacheKey(addon: Addon): string {
  return `${addon.id}|${addon.name}|${addon.addonType}|${addon.description ?? ''}`;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
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

export function stripIngredientMeta(description?: string): string {
  if (!description) return '';
  return description
    .replace(/\[meta\|[^\]]*\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildIngredientDescription(description: string, meta: IngredientMeta): string {
  const clean = stripIngredientMeta(description);
  const token = `${META_PREFIX}station=${meta.station}|scope=${meta.scope}|priority=${meta.priority}${META_SUFFIX}`;
  return clean ? `${clean}\n${token}` : token;
}

function inferMetaFallback(addon: Addon): IngredientMeta {
  if (addon.addonType === 'REMOVAL') {
    return {
      station: 'FINISHING',
      scope: 'BURGER',
      priority: 'FAST',
    };
  }

  if (addon.addonType === 'SIZE_CHANGE') {
    const value = normalize(`${addon.name} ${stripIngredientMeta(addon.description ?? '')}`);
    const scope: ProductScope = /(refrigerante|suco|agua|cha|milkshake|bebida|sabor|gelo)/.test(
      value,
    )
      ? 'DRINK'
      : /(batata|nugget|onion|acompanhamento)/.test(value)
        ? 'SIDE'
        : 'COMBO';

    return {
      station: scope === 'DRINK' ? 'DRINKS' : scope === 'SIDE' ? 'SIDES' : 'GENERAL',
      scope,
      priority: 'CRITICAL',
    };
  }

  const value = normalize(`${addon.name} ${stripIngredientMeta(addon.description ?? '')}`);

  let station: KitchenStation = 'GENERAL';
  if (/(carne|frango|bacon|hamburg|proteina)/.test(value)) station = 'PROTEINS';
  else if (/(queijo|cheddar|parmesao|mussarela|muccarela)/.test(value)) station = 'CHEESES';
  else if (/(alface|tomate|cebola|picles|pepino|vegetal)/.test(value)) station = 'VEGETABLES';
  else if (/(molho|maionese|ketchup|mostarda|barbecue|ranch)/.test(value)) station = 'SAUCES';
  else if (/(refrigerante|suco|agua|cha|gelo|bebida)/.test(value)) station = 'DRINKS';
  else if (/(batata|nugget|onion|acompanhamento)/.test(value)) station = 'SIDES';

  let scope: ProductScope = 'GENERAL';
  if (/(refrigerante|suco|agua|cha|milkshake|bebida|sabor|gelo)/.test(value)) scope = 'DRINK';
  else if (/(batata|nugget|onion|acompanhamento)/.test(value)) scope = 'SIDE';
  else if (/(upgrade|combo)/.test(value)) scope = 'COMBO';
  else if (/(pao|blend|montagem|base do lanche|criacao burger)/.test(value)) scope = 'BURGER_BUILD';
  else if (/(carne|frango|bacon|queijo|alface|tomate|cebola|picles|molho|hamburg)/.test(value))
    scope = 'BURGER';

  let priority: IngredientPriority = 'FAST';
  if (/(trocar|substituicao|upgrade|pao brioche|combo)/.test(value)) priority = 'CRITICAL';
  else if (/(extra|adiciona|adicional|bacon|carne|queijo)/.test(value)) priority = 'MEDIUM';

  return { station, scope, priority };
}

export function resolveIngredientMeta(addon: Addon): IngredientMeta {
  const cacheKey = getAddonMetaCacheKey(addon);
  const cached = ingredientMetaCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const description = addon.description ?? '';
  const tokenMatch = description.match(/\[meta\|([^\]]*)\]/);

  if (!tokenMatch) {
    const fallback = inferMetaFallback(addon);
    ingredientMetaCache.set(cacheKey, fallback);
    return fallback;
  }

  const segments = tokenMatch[1]?.split('|') ?? [];
  const parsed = segments.reduce<Record<string, string>>((acc, segment) => {
    const [key, value] = segment.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const station = asStation(parsed.station) ?? inferMetaFallback(addon).station;
  const scope = asScope(parsed.scope) ?? inferMetaFallback(addon).scope;
  const priority = asPriority(parsed.priority) ?? inferMetaFallback(addon).priority;

  const meta = { station, scope, priority };
  ingredientMetaCache.set(cacheKey, meta);
  return meta;
}

export function defaultIngredientMeta(): IngredientMeta {
  return { ...defaultMeta };
}
