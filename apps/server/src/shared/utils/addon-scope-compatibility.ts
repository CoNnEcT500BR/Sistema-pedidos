export type ProductScope = 'BURGER' | 'BURGER_BUILD' | 'DRINK' | 'SIDE' | 'COMBO' | 'GENERAL';

type AddonScopeInput = {
  name: string;
  addonType: string;
  scope?: string | null;
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

function getScopeFromField(scope?: string | null): ProductScope | null {
  if (!scope) return null;
  const normalized = scope.trim().toUpperCase();
  const allowed: ProductScope[] = ['BURGER', 'BURGER_BUILD', 'DRINK', 'SIDE', 'COMBO', 'GENERAL'];
  return allowed.includes(normalized as ProductScope) ? (normalized as ProductScope) : null;
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
  const addonScope = getScopeFromField(addon.scope) ?? 'GENERAL';

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
