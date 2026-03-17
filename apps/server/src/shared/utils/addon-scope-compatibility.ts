export type ProductScope = 'BURGER' | 'BURGER_BUILD' | 'DRINK' | 'SIDE' | 'COMBO' | 'GENERAL';

type AddonScopeInput = {
  name: string;
  addonType: string;
  description?: string | null;
};

function normalizeScopeSource(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function inferMenuItemScope(
  categoryName?: string | null,
  itemName?: string | null,
): ProductScope {
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

function inferAddonScope(addon: Pick<AddonScopeInput, 'name' | 'description'>): ProductScope {
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

export function isNamedAsExtra(value: string): boolean {
  const normalized = normalizeScopeSource(value);
  return /\bextra\b|\bextras\b|\badicional\b|\badicionais\b/.test(normalized);
}

function isAddonTypeAllowedForScope(addonType: string, scope: ProductScope): boolean {
  if (scope === 'BURGER_BUILD') {
    return addonType === 'SUBSTITUTION' || addonType === 'REMOVAL';
  }

  if (addonType === 'SIZE_CHANGE') {
    return scope === 'DRINK' || scope === 'SIDE' || scope === 'COMBO';
  }

  return true;
}

export function isAddonCompatibleWithScope(addon: AddonScopeInput, scope: ProductScope): boolean {
  const addonScope = inferAddonScope(addon);

  if (!isAddonTypeAllowedForScope(addon.addonType, scope)) {
    return false;
  }

  if (scope === 'BURGER_BUILD' && isNamedAsExtra(addon.name)) {
    return false;
  }

  if (addonScope === 'GENERAL' || scope === 'GENERAL') return true;
  if (scope === 'BURGER_BUILD') return addonScope === 'BURGER_BUILD' || addonScope === 'BURGER';

  return addonScope === scope;
}
