import { prisma } from '@/shared/database/prisma.client';
import type { CalculatedOrderItem, CalculatedOrderResult, OrderItemInput } from './orders.types';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class OrderCalculationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function calculateOrderTotal(items: OrderItemInput[]): Promise<CalculatedOrderResult> {
  const menuItemIds = items.flatMap((item) => (item.menuItemId ? [item.menuItemId] : []));
  const comboIds = items.flatMap((item) => (item.comboId ? [item.comboId] : []));
  const addonIds = items.flatMap((item) => item.addons.map((addon) => addon.addonId));

  const [menuItems, combos, addons] = await Promise.all([
    menuItemIds.length
      ? prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } })
      : Promise.resolve([]),
    comboIds.length
      ? prisma.combo.findMany({ where: { id: { in: comboIds } } })
      : Promise.resolve([]),
    addonIds.length
      ? prisma.addon.findMany({ where: { id: { in: addonIds }, isActive: true } })
      : Promise.resolve([]),
  ]);

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
  const comboMap = new Map(combos.map((combo) => [combo.id, combo]));
  const addonMap = new Map(addons.map((addon) => [addon.id, addon]));

  const menuItemAddonPermissions = await prisma.menuItemAddon.findMany({
    where: {
      menuItemId: { in: menuItemIds },
      addonId: { in: addonIds },
    },
  });

  const allowedAddonByMenuItem = new Map<string, Set<string>>();
  for (const permission of menuItemAddonPermissions) {
    const current = allowedAddonByMenuItem.get(permission.menuItemId) ?? new Set<string>();
    current.add(permission.addonId);
    allowedAddonByMenuItem.set(permission.menuItemId, current);
  }

  const processedItems: CalculatedOrderItem[] = [];
  let totalAmount = 0;

  for (const item of items) {
    let unitPrice = 0;
    const processedAddons = [];

    if (item.menuItemId) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new OrderCalculationError('Menu item invalido ou indisponivel');
      }

      unitPrice = menuItem.price;

      for (const addonInput of item.addons) {
        const addon = addonMap.get(addonInput.addonId);
        if (!addon) {
          throw new OrderCalculationError('Addon invalido ou inativo');
        }

        const allowed =
          allowedAddonByMenuItem.get(item.menuItemId)?.has(addonInput.addonId) ?? false;
        if (!allowed) {
          throw new OrderCalculationError('Addon nao permitido para este item');
        }

        const addonSubtotal = round2(addon.price * addonInput.quantity);
        processedAddons.push({
          addonId: addon.id,
          quantity: addonInput.quantity,
          addonPrice: addon.price,
          subtotal: addonSubtotal,
        });

        unitPrice = round2(unitPrice + addonSubtotal);
      }
    }

    if (item.comboId) {
      const combo = comboMap.get(item.comboId);
      if (!combo || !combo.isActive) {
        throw new OrderCalculationError('Combo invalido ou indisponivel');
      }

      unitPrice = combo.price;

      for (const addonInput of item.addons) {
        const addon = addonMap.get(addonInput.addonId);
        if (!addon) {
          throw new OrderCalculationError('Addon invalido ou inativo');
        }

        const addonSubtotal = round2(addon.price * addonInput.quantity);
        processedAddons.push({
          addonId: addon.id,
          quantity: addonInput.quantity,
          addonPrice: addon.price,
          subtotal: addonSubtotal,
        });

        unitPrice = round2(unitPrice + addonSubtotal);
      }
    }

    const subtotal = round2(unitPrice * item.quantity);
    totalAmount = round2(totalAmount + subtotal);

    processedItems.push({
      menuItemId: item.menuItemId,
      comboId: item.comboId,
      quantity: item.quantity,
      notes: item.notes,
      unitPrice,
      subtotal,
      addons: processedAddons,
    });
  }

  return {
    items: processedItems,
    totalAmount,
  };
}
