export interface MenuItemStockLink {
  isRequired: boolean;
  stockQuantity: number | null;
  inventoryIngredient: { currentQuantity: number | null } | null;
}

export function isMenuItemStockAvailable(menuItem: {
  isAvailable: boolean;
  addons: MenuItemStockLink[];
}): boolean {
  return (
    menuItem.isAvailable &&
    menuItem.addons.every((link) => {
      if (!link.isRequired || link.inventoryIngredient?.currentQuantity == null) {
        return true;
      }

      return (
        link.stockQuantity !== null &&
        link.inventoryIngredient.currentQuantity >= link.stockQuantity
      );
    })
  );
}
