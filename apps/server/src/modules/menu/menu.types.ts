import { z } from 'zod';

const menuItemSchemaBase = z.object({
  categoryId: z.string().min(1, 'categoryId obrigatorio'),
  name: z.string().min(2, 'name obrigatorio'),
  description: z.string().optional(),
  price: z.number().positive('price deve ser maior que zero'),
  icon: z.string().optional(),
  imageUrl: z.string().url('imageUrl invalida').optional(),
  displayOrder: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  addonIds: z.array(z.string().min(1, 'addonId obrigatorio')).optional(),
  assemblyAddonIds: z.array(z.string().min(1, 'addonId obrigatorio')).optional(),
  extraAddonIds: z.array(z.string().min(1, 'addonId obrigatorio')).optional(),
});

const validateAddonAssignments = (
  value: { assemblyAddonIds?: string[]; extraAddonIds?: string[] },
  ctx: z.RefinementCtx,
) => {
  const assembly = value.assemblyAddonIds ?? [];
  const extras = value.extraAddonIds ?? [];

  if (new Set(assembly).size !== assembly.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'assemblyAddonIds com duplicidade',
      path: ['assemblyAddonIds'],
    });
  }

  if (new Set(extras).size !== extras.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'extraAddonIds com duplicidade',
      path: ['extraAddonIds'],
    });
  }

  const overlap = assembly.some((id) => extras.includes(id));
  if (overlap) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'assemblyAddonIds e extraAddonIds nao podem repetir o mesmo addon',
      path: ['extraAddonIds'],
    });
  }
};

export const createMenuItemSchema = menuItemSchemaBase.superRefine(validateAddonAssignments);

export const updateMenuItemSchema = menuItemSchemaBase
  .partial()
  .superRefine(validateAddonAssignments);

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const reorderMenuItemsSchema = z.object({
  categoryId: z.string().min(1, 'categoryId obrigatorio'),
  orderedItemIds: z
    .array(z.string().min(1, 'itemId obrigatorio'))
    .min(1, 'orderedItemIds obrigatorio')
    .refine((value) => new Set(value).size === value.length, 'orderedItemIds com duplicidade'),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, 'name obrigatorio'),
  description: z.string().optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const updateCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ReorderMenuItemsInput = z.infer<typeof reorderMenuItemsSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
