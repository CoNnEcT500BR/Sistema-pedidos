import { prisma } from '@/shared/database/prisma.client';

export const addonsRepository = {
  listActiveAddons: () =>
    prisma.addon.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),

  listAllAddons: () =>
    prisma.addon.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    }),

  listAddonNameIndex: () =>
    prisma.addon.findMany({
      select: {
        id: true,
        name: true,
      },
    }),

  createAddon: (data: {
    name: string;
    addonType: string;
    price: number;
    scope?: string;
    station?: string;
    priority?: string;
    description?: string;
    isActive?: boolean;
  }) =>
    prisma.addon.create({
      data,
    }),

  updateAddon: (id: string, data: Record<string, unknown>) =>
    prisma.addon.update({
      where: { id },
      data,
    }),

  deleteAddon: (id: string) =>
    prisma.addon.delete({
      where: { id },
    }),

  listAllowedAddonsByMenuItem: (menuItemId: string) =>
    prisma.menuItemAddon.findMany({
      where: { menuItemId },
      include: {
        addon: true,
      },
      orderBy: { displayOrder: 'asc' },
    }),

  findMenuItemById: (menuItemId: string) =>
    prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
};
