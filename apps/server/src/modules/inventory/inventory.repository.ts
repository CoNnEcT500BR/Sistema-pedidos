import { prisma } from '@/shared/database/prismaClient.js';
import type {
  CountInventoryIngredientInput,
  CreateInventoryIngredientInput,
  UpdateInventoryIngredientInput,
} from './inventoryTypes.js';

export const inventoryRepository = {
  list: async () => {
    const ingredients = await prisma.inventoryIngredient.findMany({
      include: {
        menuItemAddons: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return ingredients.map(({ menuItemAddons, ...ingredient }) => ({
      ...ingredient,
      linkedMenuItems: Array.from(
        new Map(
          menuItemAddons.map(({ menuItem }) => [menuItem.id, menuItem]),
        ).values(),
      ),
    }));
  },

  listRecipes: () =>
    prisma.menuItemAddon.findMany({
      include: {
        menuItem: { select: { id: true, name: true, isAvailable: true } },
        addon: { select: { id: true, name: true } },
        inventoryIngredient: {
          select: { id: true, name: true, unit: true, currentQuantity: true },
        },
      },
      orderBy: [{ menuItem: { name: 'asc' } }, { displayOrder: 'asc' }],
    }),

  listMovements: () =>
    prisma.inventoryMovement.findMany({
      include: {
        ingredient: { select: { id: true, name: true, unit: true } },
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),

  findIngredientById: (id: string) =>
    prisma.inventoryIngredient.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    }),

  create: (data: CreateInventoryIngredientInput) =>
    prisma.inventoryIngredient.create({
      data: {
        ...data,
        currentQuantity: null,
      },
    }),

  update: (id: string, data: UpdateInventoryIngredientInput) =>
    prisma.inventoryIngredient.update({
      where: { id },
      data,
    }),

  updateRecipe: (id: string, inventoryIngredientId: string | null, stockQuantity: number | null) =>
    prisma.$transaction(async (tx) => {
      const current = await tx.menuItemAddon.findUnique({
        where: { id },
        select: { inventoryIngredientId: true },
      });
      if (!current) {
        return null;
      }

      const recipe = await tx.menuItemAddon.update({
        where: { id },
        data: { inventoryIngredientId, stockQuantity },
      });

      return {
        recipe,
        affectedIngredientIds: Array.from(
          new Set(
            [current.inventoryIngredientId, inventoryIngredientId].filter(
              (ingredientId): ingredientId is string => Boolean(ingredientId),
            ),
          ),
        ),
      };
    }),

  count: (id: string, data: CountInventoryIngredientInput) =>
    prisma.$transaction(async (tx) => {
      const current = await tx.inventoryIngredient.findUnique({ where: { id } });
      if (!current) {
        return null;
      }

      const previousQuantity = current.currentQuantity;
      const quantityDelta = data.quantity - (previousQuantity ?? 0);
      const ingredient = await tx.inventoryIngredient.update({
        where: { id },
        data: { currentQuantity: data.quantity },
      });

      if (quantityDelta !== 0 || previousQuantity === null) {
        await tx.inventoryMovement.create({
          data: {
            ingredientId: id,
            quantityDelta,
            reason: previousQuantity === null ? 'INITIAL_COUNT' : 'COUNT_ADJUSTMENT',
            note: data.note,
          },
        });
      }

      return ingredient;
    }),
};
