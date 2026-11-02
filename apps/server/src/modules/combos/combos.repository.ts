import { prisma } from '@/shared/database/prismaClient.js';
import { isMenuItemStockAvailable } from '@/shared/inventory/menu-stock-availability.js';

import type { CreateComboInput, UpdateComboInput } from './combosTypes.js';

export const combosRepository = {
  listActiveCombos: async () => {
    const combos = await prisma.combo.findMany({
      where: { isActive: true },
      include: {
        comboItems: {
          include: {
            menuItem: {
              include: {
                addons: {
                  select: {
                    isRequired: true,
                    stockQuantity: true,
                    inventoryIngredient: { select: { currentQuantity: true } },
                  },
                },
              },
            },
          },
          orderBy: { menuItem: { name: 'asc' } },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return combos
      .filter((combo) => combo.comboItems.every((item) => isMenuItemStockAvailable(item.menuItem)))
      .map((combo) => ({
        ...combo,
        comboItems: combo.comboItems.map((item) => ({
          ...item,
          menuItem: (({ addons: _addons, ...menuItem }) => menuItem)(item.menuItem),
        })),
      }));
  },

  listAllCombos: () =>
    prisma.combo.findMany({
      include: {
        comboItems: {
          include: {
            menuItem: true,
          },
          orderBy: { menuItem: { name: 'asc' } },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),

  findById: (id: string) =>
    prisma.combo.findUnique({
      where: { id },
      include: {
        comboItems: {
          include: {
            menuItem: true,
          },
          orderBy: { menuItem: { name: 'asc' } },
        },
      },
    }),

  create: async (payload: CreateComboInput) => {
    return prisma.combo.create({
      data: {
        name: payload.name,
        description: payload.description,
        price: payload.price,
        icon: payload.icon,
        displayOrder: payload.displayOrder,
        comboItems: {
          create: payload.comboItems.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        comboItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  },

  update: async (id: string, payload: UpdateComboInput) => {
    const { comboItems, ...comboData } = payload;

    if (!comboItems) {
      return prisma.combo.update({
        where: { id },
        data: comboData,
        include: {
          comboItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });
    }

    return prisma.$transaction(async (tx) => {
      await tx.comboItem.deleteMany({
        where: { comboId: id },
      });

      return tx.combo.update({
        where: { id },
        data: {
          ...comboData,
          comboItems: {
            create: comboItems.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          comboItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });
    });
  },

  updateAvailability: (id: string, isAvailable: boolean) =>
    prisma.combo.update({
      where: { id },
      data: { isActive: isAvailable },
      include: {
        comboItems: {
          include: {
            menuItem: true,
          },
        },
      },
    }),

  delete: (id: string) =>
    prisma.combo.delete({
      where: { id },
      include: {
        comboItems: {
          include: {
            menuItem: true,
          },
        },
      },
    }),
};
