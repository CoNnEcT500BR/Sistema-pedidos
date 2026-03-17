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

  // Obter lista de removíveis permitidos
  let allowedRemovables: Set<string> = new Set();
  if (removablesJson) {
    try {
      const parsed = JSON.parse(removablesJson);
      allowedRemovables = new Set(parsed);
    } catch {
      // Ignorar erros de parsing
    }
  }

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
    if (!allowedRemovables.has(addon.name)) {
      return {
        itemIndex,
        itemName,
        message: `"${addon.name}" não é um removível permitido para "${itemName}"`,
      };
    }
  }

  // Validar sabor obrigatório se houver grupo de sabores
  const itemAllowedAddons = allAllowedAddonByMenuItem.get(menuItem.id) ?? new Set();
  const itemAllAddonData = Array.from(itemAllowedAddons)
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
        select: { comboId: true, menuItemId: true },
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
          select: { menuItemId: true, addonId: true },
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
    }

    if (item.comboId) {
      const combo = comboMap.get(item.comboId);
      if (!combo || !combo.isActive) {
        throw new OrderCalculationError('Combo invalido ou indisponivel');
      }
      itemName = combo.name;

      // Para combos, validar os itens do combo que têm sabor/removíveis
      const comboItemsForCombo = comboItems.filter((ci) => ci.comboId === item.comboId);
      for (const ci of comboItemsForCombo) {
        const comboMenuItem = menuItemMap.get(ci.menuItemId);
        if (!comboMenuItem) continue;

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
    }
  }

  if (itemValidationErrors.length > 0) {
    throw new OrderValidationError(itemValidationErrors);
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
