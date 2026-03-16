import { z } from 'zod';

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1, 'categoryId obrigatorio'),
  name: z.string().min(2, 'name obrigatorio'),
  description: z.string().optional(),
  price: z.number().positive('price deve ser maior que zero'),
  icon: z.string().optional(),
  imageUrl: z.string().url('imageUrl invalida').optional(),
  displayOrder: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  addonIds: z.array(z.string().min(1, 'addonId obrigatorio')).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
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
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
