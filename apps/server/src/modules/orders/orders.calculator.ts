import { prisma } from '@/shared/database/prismaClient.js';
import type { CalculatedOrderItem, CalculatedOrderResult, OrderItemInput } from './ordersTypes.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

type RemovableMenuItem = { id: string; removablesJson?: string | null };

function getAllowedRemovables(removablesJson?: string | null): Set<string> {
  if (!removablesJson) return new Set();
  try {
    const parsed: unknown = JSON.parse(removablesJson);
    return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string')
      ? new Set(parsed)
      : new Set();
  } catch {
    return new Set();
  }
}

function resolveRemovedAddonIds(
  itemIndex: number,
  itemName: string,
  menuItems: RemovableMenuItem[],
  removedAddonIds: string[],
  allAddonsMap: Map<string, { id: string; name: string; addonType: string }>,
  allAllowedAddonByMenuItem: Map<string, Set<string>>,
): {
  byMenuItem: Map<string, Set<string>>;
  error?: ItemValidationError;
} {
  const byMenuItem = new Map(
    menuItems.map((menuItem) => [menuItem.id, new Set<string>()]),
  );

  for (const addonId of removedAddonIds) {
    const addon = allAddonsMap.get(addonId);
    const allowedMenuItems =
      addon?.addonType === 'REMOVAL'
        ? menuItems.filter(
            (menuItem) =>
              allAllowedAddonByMenuItem.get(menuItem.id)?.has(addonId) &&
              getAllowedRemovables(menuItem.removablesJson).has(addon.name),
          )
        : [];

    if (allowedMenuItems.length === 0) {
      return {
        byMenuItem,
        error: {
          itemIndex,
          itemName,
          message: `Remoção inválida para "${itemName}"`,
        },
      };
    }

    for (const menuItem of allowedMenuItems) {
      byMenuItem.get(menuItem.id)?.add(addonId);
    }
  }

  return { byMenuItem };
}

export class OrderCalculationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export interface ItemValidationError {
  itemIndex: number;
  itemName: string;
  message: string;
}

export class OrderValidationError extends Error {
  statusCode = 400;
  itemErrors: ItemValidationError[];

  constructor(itemErrors: ItemValidationError[]) {
    const message = itemErrors.map((e) => e.message).join('; ');
    super(message);
    this.itemErrors = itemErrors;
  }
}

async function validateItemAddons(
  itemIndex: number,
  itemName: string,
  menuItem: { id: string; name: string } | null,
  addons: { addonId: string; quantity: number }[],
  allAddonsMap: Map<string, { id: string; name: string; addonType: string }>,
  allAllowedAddonByMenuItem: Map<string, Set<string>>,
  removablesJson?: string | null,
): Promise<ItemValidationError | null> {
  if (!menuItem) return null;

  const allowedRemovables = getAllowedRemovables(removablesJson);
  const itemAllowedAddonIds = allAllowedAddonByMenuItem.get(menuItem.id) ?? new Set();

  // Agrupar addons selecionados
  const selectedAddons = addons
    .map((a) => {
      const addon = allAddonsMap.get(a.addonId);
      return addon ? { ...addon, selectedQty: a.quantity } : null;
    })
    .filter((a): a is { id: string; name: string; addonType: string; selectedQty: number } => !!a);

  const flavorAddons = selectedAddons.filter((a) => a.name.startsWith('Sabor '));
  const removableAddons = selectedAddons.filter((a) => a.addonType === 'REMOVAL');
  // Validar que removíveis selecionados sejam aqueles permitidos para o item
  for (const addon of removableAddons) {
    if (!itemAllowedAddonIds.has(addon.id) || !allowedRemovables.has(addon.name)) {
      return {
        itemIndex,
        itemName,
        message: `"${addon.name}" não é um removível permitido para "${itemName}"`,
      };
    }
  }

  // Validar sabor obrigatório se houver grupo de sabores
  const itemAllAddonData = Array.from(itemAllowedAddonIds)
    .map((id) => allAddonsMap.get(id))
    .filter((a): a is { id: string; name: string; addonType: string } => !!a);

  const itemFlavorAddons = itemAllAddonData.filter((a) => a.name.startsWith('Sabor '));

  if (itemFlavorAddons.length > 0 && flavorAddons.length === 0) {
    const options = itemFlavorAddons.map((a) => a.name.replace('Sabor ', '')).join(', ');
    return {
      itemIndex,
      itemName,
      message: `Sabor obrigatório para "${itemName}" (opções: ${options})`,
    };
  }

  // Validar máximo 1 sabor
  if (flavorAddons.length > 1) {
    return {
      itemIndex,
      itemName,
      message: `Apenas 1 sabor permitido para "${itemName}", selecionou ${flavorAddons.length}`,
    };
  }

  // Validar SIZE_CHANGE: upgrade só é permitido para tamanho maior que o atual
  const sizeChangeAddons = selectedAddons.filter((a) => a.addonType === 'SIZE_CHANGE');
  if (sizeChangeAddons.length > 0) {
    const sizeRank: Record<string, number> = { P: 0, M: 1, G: 2 };

    const itemSizeMatch = menuItem.name.match(/\s([PMG])$/);
    const itemSize = itemSizeMatch?.[1];

    if (itemSize) {
      for (const addon of sizeChangeAddons) {
        const addonSizeMatch = addon.name.match(/\s([PMG])$/);
        const targetSize = addonSizeMatch?.[1];

        if (targetSize && sizeRank[targetSize] <= sizeRank[itemSize]) {
          return {
            itemIndex,
            itemName,
            message: `Upgrade "${addon.name}" inválido para "${menuItem.name}": tamanho alvo deve ser maior que o atual`,
          };
        }
      }
    }
  }

  return null;
}

export async function calculateOrderTotal(items: OrderItemInput[]): Promise<CalculatedOrderResult> {
  const menuItemIds = items.flatMap((item) => (item.menuItemId ? [item.menuItemId] : []));
  const comboIds = items.flatMap((item) => (item.comboId ? [item.comboId] : []));
  const addonIds = items.flatMap((item) => item.addons.map((addon) => addon.addonId));

  // Buscar combos items mapeados primeiro para determinar quais menuItems precisamos
  const comboItems = comboIds.length
    ? await prisma.comboItem.findMany({
        where: { comboId: { in: comboIds } },
        select: { comboId: true, menuItemId: true, quantity: true },
      })
    : [];

  const comboMenuItemIds = Array.from(new Set(comboItems.map((ci) => ci.menuItemId)));
  const permittedMenuItemIds = Array.from(new Set([...menuItemIds, ...comboMenuItemIds]));

  // Buscar dados principais com uma única query de MenuItemAddon para todos os itens
  const [menuItems, combos, addons, allMenuItemAddons, allAllowedAddons] = await Promise.all([
    menuItemIds.length
      ? prisma.menuItem.findMany({
          where: { id: { in: menuItemIds } },
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true,
            removablesJson: true,
          },
        })
      : Promise.resolve([]),
    comboIds.length
      ? prisma.combo.findMany({ where: { id: { in: comboIds } } })
      : Promise.resolve([]),
    addonIds.length
      ? prisma.addon.findMany({ where: { id: { in: addonIds }, isActive: true } })
      : Promise.resolve([]),
    permittedMenuItemIds.length
      ? prisma.menuItemAddon.findMany({
          where: { menuItemId: { in: permittedMenuItemIds } },
          select: {
            menuItemId: true,
            addonId: true,
            isRequired: true,
            inventoryIngredientId: true,
            stockQuantity: true,
            addon: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    // Carregar TODOS os addons permitidos para os items (para validação)
    permittedMenuItemIds.length
      ? prisma.addon.findMany({
          where: {
            menuItemAddons: {
              some: { menuItemId: { in: permittedMenuItemIds } },
            },
            isActive: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
  const comboMap = new Map(combos.map((combo) => [combo.id, combo]));

  // Usar todos os addons permitidos para mapa, mas também manter os do payload para preço
  const allAddonsMap = new Map(allAllowedAddons.map((addon) => [addon.id, addon]));
  const payloadAddonIds = new Set(addonIds);

  // Mapa de addons do payload (para validação de preço que eles realmente existem)
  const addonMap = new Map(
    addons.filter((a) => payloadAddonIds.has(a.id)).map((addon) => [addon.id, addon]),
  );

  // Mapa de todos os addons permitidos por item (não apenas os que estão no pedido)
  const allAllowedAddonByMenuItem = new Map<string, Set<string>>();
  for (const permission of allMenuItemAddons) {
    const current = allAllowedAddonByMenuItem.get(permission.menuItemId) ?? new Set<string>();
    current.add(permission.addonId);
    allAllowedAddonByMenuItem.set(permission.menuItemId, current);
  }

  // Mapa de addons permitidos apenas para os addons no pedido (para validação de preço)
  const allowedAddonByMenuItem = new Map<string, Set<string>>();
  for (const permission of allMenuItemAddons) {
    if (!addonIds.includes(permission.addonId)) continue; // Apenas os que estão no pedido
    const current = allowedAddonByMenuItem.get(permission.menuItemId) ?? new Set<string>();
    current.add(permission.addonId);
    allowedAddonByMenuItem.set(permission.menuItemId, current);
  }

  const allowedAddonByCombo = new Map<string, Set<string>>();
  for (const comboItem of comboItems) {
    const comboAllowed = allowedAddonByMenuItem.get(comboItem.menuItemId) ?? new Set<string>();
    const current = allowedAddonByCombo.get(comboItem.comboId) ?? new Set<string>();
    for (const addonId of comboAllowed) {
      current.add(addonId);
    }
    allowedAddonByCombo.set(comboItem.comboId, current);
  }

  // Validar regras de sabor e removíveis por item
  const itemValidationErrors: ItemValidationError[] = [];
  const removedAddonIdsByMenuItemByItemIndex = new Map<
    number,
    Map<string, Set<string>>
  >();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let itemName = '';

    if (item.menuItemId) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new OrderCalculationError('Menu item invalido ou indisponivel');
      }
      itemName = menuItem.name;

      const error = await validateItemAddons(
        i,
        itemName,
        menuItem,
        item.addons,
        allAddonsMap,
        allAllowedAddonByMenuItem,
        menuItem.removablesJson,
      );
      if (error) itemValidationErrors.push(error);
      const resolvedRemovedAddons = resolveRemovedAddonIds(
        i,
        itemName,
        [menuItem],
        item.removedAddonIds,
        allAddonsMap,
        allAllowedAddonByMenuItem,
      );
      removedAddonIdsByMenuItemByItemIndex.set(i, resolvedRemovedAddons.byMenuItem);
      if (resolvedRemovedAddons.error) {
        itemValidationErrors.push(resolvedRemovedAddons.error);
      }
    }

    if (item.comboId) {
      const combo = comboMap.get(item.comboId);
      if (!combo || !combo.isActive) {
        throw new OrderCalculationError('Combo invalido ou indisponivel');
      }
      itemName = combo.name;

      // Para combos, validar os itens do combo que têm sabor/removíveis
      const comboItemsForCombo = comboItems.filter((ci) => ci.comboId === item.comboId);
      const removableMenuItems: RemovableMenuItem[] = [];
      for (const ci of comboItemsForCombo) {
        const comboMenuItem = menuItemMap.get(ci.menuItemId);
        if (!comboMenuItem) continue;
        removableMenuItems.push(comboMenuItem);

        const error = await validateItemAddons(
          i,
          `${itemName} > ${comboMenuItem.name}`,
          comboMenuItem,
          item.addons,
          allAddonsMap,
          allAllowedAddonByMenuItem,
          comboMenuItem.removablesJson,
        );
        if (error) itemValidationErrors.push(error);
      }
      const resolvedRemovedAddons = resolveRemovedAddonIds(
        i,
        itemName,
        removableMenuItems,
        item.removedAddonIds,
        allAddonsMap,
        allAllowedAddonByMenuItem,
      );
      removedAddonIdsByMenuItemByItemIndex.set(i, resolvedRemovedAddons.byMenuItem);
      if (resolvedRemovedAddons.error) {
        itemValidationErrors.push(resolvedRemovedAddons.error);
      }
    }
  }

  if (itemValidationErrors.length > 0) {
    throw new OrderValidationError(itemValidationErrors);
  }

  const processedItems: CalculatedOrderItem[] = [];
  const stockRequirements = new Map<string, number>();
  let totalAmount = 0;

  const addStockRequirements = (
    menuItemId: string,
    itemQuantity: number,
    selectedAddons: Map<string, number>,
    removedAddonIds: Set<string>,
  ) => {
    for (const mapping of allMenuItemAddons) {
      if (mapping.menuItemId !== menuItemId || !mapping.inventoryIngredientId) continue;
      if (removedAddonIds.has(mapping.addonId)) continue;

      const selectedQuantity = selectedAddons.get(mapping.addonId) ?? 0;
      if (!mapping.isRequired && selectedQuantity === 0) continue;
      if (mapping.stockQuantity === null || mapping.stockQuantity <= 0) {
        throw new OrderCalculationError('A receita do produto possui uma quantidade de estoque inválida.', 409);
      }

      const requiredQuantity = mapping.stockQuantity * itemQuantity * Math.max(selectedQuantity, 1);
      const current = stockRequirements.get(mapping.inventoryIngredientId) ?? 0;
      stockRequirements.set(mapping.inventoryIngredientId, current + requiredQuantity);
    }
  };

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    const item = items[itemIndex];
    let unitPrice = 0;
    const processedAddons = [];
    const selectedAddons = new Map(item.addons.map((addon) => [addon.addonId, addon.quantity]));
    const removedAddonIdsByMenuItem =
      removedAddonIdsByMenuItemByItemIndex.get(itemIndex) ?? new Map<string, Set<string>>();
    const removedIngredients = item.removedAddonIds
      .map((addonId) => allAddonsMap.get(addonId)?.name)
      .filter((name): name is string => Boolean(name));
    const removedIngredientLabels = Array.from(
      new Set(removedIngredients.map((name) => name.trim().replace(/^sem\s+/i, ''))),
    );

    if (item.menuItemId) {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new OrderCalculationError('Menu item invalido ou indisponivel');
      }

      unitPrice = menuItem.price;
      addStockRequirements(
        item.menuItemId,
        item.quantity,
        selectedAddons,
        removedAddonIdsByMenuItem.get(item.menuItemId) ?? new Set(),
      );

      for (const addonInput of item.addons) {
        if (addonInput.quantity > 10) {
          throw new OrderCalculationError('Quantidade de addon acima do permitido');
        }

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
      for (const comboItem of comboItems) {
        if (comboItem.comboId === item.comboId) {
          addStockRequirements(
            comboItem.menuItemId,
            item.quantity * comboItem.quantity,
            selectedAddons,
            removedAddonIdsByMenuItem.get(comboItem.menuItemId) ?? new Set(),
          );
        }
      }

      for (const addonInput of item.addons) {
        if (addonInput.quantity > 10) {
          throw new OrderCalculationError('Quantidade de addon acima do permitido');
        }

        const addon = addonMap.get(addonInput.addonId);
        if (!addon) {
          throw new OrderCalculationError('Addon invalido ou inativo');
        }

        const allowedForCombo =
          (allowedAddonByCombo.get(item.comboId)?.has(addonInput.addonId) ?? false) ||
          addon.name.startsWith('Upgrade ');
        if (!allowedForCombo) {
          throw new OrderCalculationError('Addon nao permitido para este combo');
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
      removedIngredients: removedIngredientLabels,
      unitPrice,
      subtotal,
      addons: processedAddons,
    });
  }

  return {
    items: processedItems,
    totalAmount,
    stockRequirements: Array.from(stockRequirements, ([ingredientId, quantity]) => ({
      ingredientId,
      quantity,
    })),
  };
}
