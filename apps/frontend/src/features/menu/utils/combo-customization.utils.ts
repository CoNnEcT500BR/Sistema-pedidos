import type { Addon, Combo } from '@/features/menu/types/menu.types';

export const UPGRADE_POTATO_M = 'Upgrade Batata para M';
export const UPGRADE_POTATO_G = 'Upgrade Batata para G';
export const UPGRADE_DRINK_M = 'Upgrade Bebida para M';
export const UPGRADE_DRINK_G = 'Upgrade Bebida para G';

export function isDrinkMenuItemName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes('refrigerante') ||
    lower.includes('suco') ||
    lower.includes('cha gelado') ||
    lower.includes('agua mineral') ||
    lower.includes('milkshake')
  );
}

export function isPotatoComboUpgradeName(name: string): boolean {
  return name.startsWith('Upgrade Batata');
}

export function isDrinkComboUpgradeName(name: string): boolean {
  return name.startsWith('Upgrade Bebida');
}

export function isComboUpgradeAddon(addon: Addon): boolean {
  return (
    addon.addonType === 'SIZE_CHANGE' &&
    (isPotatoComboUpgradeName(addon.name) || isDrinkComboUpgradeName(addon.name))
  );
}

export function filterComboUpgradesFromExtras(addons: Addon[]): Addon[] {
  return addons.filter((addon) => !isComboUpgradeAddon(addon));
}

function getSizeSuffix(name: string | undefined): 'P' | 'M' | 'G' | null {
  if (!name) return null;
  const match = name.match(/\s([PMG])$/);
  return (match?.[1] as 'P' | 'M' | 'G' | undefined) ?? null;
}

export function buildComboUpgradeOptions(allAddons: Addon[], combo: Combo | null): Addon[] {
  if (!combo?.comboItems) return [];

  const byName = new Map(allAddons.map((addon) => [addon.name, addon]));
  const options: Addon[] = [];

  const potatoItem = combo.comboItems.find((entry) =>
    entry.menuItem.name.toLowerCase().includes('batata'),
  )?.menuItem;
  const drinkItem = combo.comboItems.find((entry) =>
    isDrinkMenuItemName(entry.menuItem.name),
  )?.menuItem;

  const potatoSize = getSizeSuffix(potatoItem?.name);
  if (potatoSize === 'P') {
    const mediumUpgrade = byName.get(UPGRADE_POTATO_M);
    const largeUpgrade = byName.get(UPGRADE_POTATO_G);
    if (mediumUpgrade) options.push(mediumUpgrade);
    if (largeUpgrade) options.push(largeUpgrade);
  } else if (potatoSize === 'M') {
    const largeUpgrade = byName.get(UPGRADE_POTATO_G);
    if (largeUpgrade) options.push(largeUpgrade);
  }

  const drinkSize = getSizeSuffix(drinkItem?.name);
  if (drinkSize === 'P') {
    const mediumUpgrade = byName.get(UPGRADE_DRINK_M);
    const largeUpgrade = byName.get(UPGRADE_DRINK_G);
    if (mediumUpgrade) options.push(mediumUpgrade);
    if (largeUpgrade) options.push(largeUpgrade);
  } else if (drinkSize === 'M') {
    const largeUpgrade = byName.get(UPGRADE_DRINK_G);
    if (largeUpgrade) options.push(largeUpgrade);
  }

  return options;
}
