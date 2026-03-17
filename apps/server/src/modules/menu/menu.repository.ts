import { prisma } from '@/shared/database/prisma.client';

export const menuRepository = {
  listActiveCategories: () =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),

  listAllCategories: () =>
    prisma.category.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),

  createCategory: (data: {
    name: string;
    description?: string;
    icon?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) =>
    prisma.category.create({
      data,
    }),

  updateCategory: (id: string, data: Record<string, unknown>) =>
    prisma.category.update({
      where: { id },
      data,
    }),

  deleteCategory: (id: string) =>
    prisma.category.delete({
      where: { id },
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

  listAdminMenuItems: (categoryId?: string) =>
    prisma.menuItem.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }, { name: 'asc' }],
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

  getMenuItemBasicById: (id: string) =>
    prisma.menuItem.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        categoryId: true,
        displayOrder: true,
      },
    }),

  listMenuItemIdsByCategory: (categoryId: string) =>
    prisma.menuItem.findMany({
      where: { categoryId },
      select: { id: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),

  findCategoryById: (id: string) =>
    prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    }),

  findAddonsByIds: (ids: string[]) =>
    prisma.addon.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        name: true,
        addonType: true,
        description: true,
      },
    }),

  getLastDisplayOrderByCategory: async (categoryId: string) => {
    const entry = await prisma.menuItem.findFirst({
      where: { categoryId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });

    return entry?.displayOrder ?? -1;
  },

  findMenuItemByCategoryAndDisplayOrder: (
    categoryId: string,
    displayOrder: number,
    excludeId?: string,
  ) =>
    prisma.menuItem.findFirst({
      where: {
        categoryId,
        displayOrder,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    }),

  reorderMenuItemsByCategory: async (_categoryId: string, orderedItemIds: string[]) => {
    await prisma.$transaction(async (tx) => {
      for (let index = 0; index < orderedItemIds.length; index += 1) {
        await tx.menuItem.update({
          where: { id: orderedItemIds[index] },
          data: {
            displayOrder: index,
          },
        });
      }
    });
  },

  createMenuItem: async (data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    icon?: string;
    imageUrl?: string;
    displayOrder?: number;
    isAvailable?: boolean;
    addonIds?: string[];
    assemblyAddonIds?: string[];
    extraAddonIds?: string[];
  }) => {
    const { addonIds = [], assemblyAddonIds, extraAddonIds, ...menuItemData } = data;

    const useSegmented = Array.isArray(assemblyAddonIds) || Array.isArray(extraAddonIds);
    const segmentedAssembly = assemblyAddonIds ?? [];
    const segmentedExtras = extraAddonIds ?? [];

    const assignmentRows = useSegmented
      ? [
          ...segmentedAssembly.map((addonId, index) => ({
            addonId,
            assignmentType: 'ASSEMBLY' as const,
            isRequired: false,
            displayOrder: index,
          })),
          ...segmentedExtras.map((addonId, index) => ({
            addonId,
            assignmentType: 'EXTRA' as const,
            isRequired: false,
            displayOrder: index,
          })),
        ]
      : addonIds.map((addonId, index) => ({
          addonId,
          assignmentType: 'ASSEMBLY' as const,
          isRequired: false,
          displayOrder: index,
        }));

    return prisma.menuItem.create({
      data: {
        ...menuItemData,
        addons: assignmentRows.length
          ? {
              create: assignmentRows,
            }
          : undefined,
      },
      include: {
        category: true,
        addons: {
          include: {
            addon: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  },

  updateMenuItem: async (id: string, data: Record<string, unknown>) => {
    const { addonIds, assemblyAddonIds, extraAddonIds, ...menuItemData } = data as Record<
      string,
      unknown
    > & {
      addonIds?: string[];
      assemblyAddonIds?: string[];
      extraAddonIds?: string[];
    };

    const shouldRewriteAddons =
      Array.isArray(addonIds) || Array.isArray(assemblyAddonIds) || Array.isArray(extraAddonIds);

    if (!shouldRewriteAddons) {
      return prisma.menuItem.update({
        where: { id },
        data: menuItemData,
        include: {
          category: true,
          addons: {
            include: {
              addon: true,
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    }

    const useSegmented = Array.isArray(assemblyAddonIds) || Array.isArray(extraAddonIds);
    const segmentedAssembly = assemblyAddonIds ?? [];
    const segmentedExtras = extraAddonIds ?? [];
    const legacyAddonIds = addonIds ?? [];

    const assignmentRows = useSegmented
      ? [
          ...segmentedAssembly.map((addonId, index) => ({
            addonId,
            assignmentType: 'ASSEMBLY' as const,
            isRequired: false,
            displayOrder: index,
          })),
          ...segmentedExtras.map((addonId, index) => ({
            addonId,
            assignmentType: 'EXTRA' as const,
            isRequired: false,
            displayOrder: index,
          })),
        ]
      : legacyAddonIds.map((addonId, index) => ({
          addonId,
          assignmentType: 'ASSEMBLY' as const,
          isRequired: false,
          displayOrder: index,
        }));

    return prisma.$transaction(async (tx) => {
      await tx.menuItemAddon.deleteMany({ where: { menuItemId: id } });

      return tx.menuItem.update({
        where: { id },
        data: {
          ...menuItemData,
          addons: assignmentRows.length
            ? {
                create: assignmentRows,
              }
            : undefined,
        },
        include: {
          category: true,
          addons: {
            include: {
              addon: true,
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    });
  },

  deleteMenuItem: (id: string) =>
    prisma.menuItem.delete({
      where: { id },
    }),
};
