import { prisma } from '@/shared/database/prisma.client';

export const menuRepository = {
  listActiveCategories: () =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),

  listMenuItems: (categoryId?: string) =>
    prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),

  getMenuItemById: (id: string) =>
    prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        addons: {
          include: {
            addon: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    }),

  createMenuItem: (data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    icon?: string;
    imageUrl?: string;
    displayOrder?: number;
  }) =>
    prisma.menuItem.create({
      data,
    }),

  updateMenuItem: (id: string, data: Record<string, unknown>) =>
    prisma.menuItem.update({
      where: { id },
      data,
    }),
};
