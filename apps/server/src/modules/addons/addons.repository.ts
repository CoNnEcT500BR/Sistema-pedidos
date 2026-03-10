import { prisma } from '@/shared/database/prisma.client';

export const addonsRepository = {
  listActiveAddons: () =>
    prisma.addon.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
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
    }),
};
