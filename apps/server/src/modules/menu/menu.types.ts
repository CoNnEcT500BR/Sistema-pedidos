import { z } from 'zod';

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1, 'categoryId obrigatorio'),
  name: z.string().min(2, 'name obrigatorio'),
  description: z.string().optional(),
  price: z.number().positive('price deve ser maior que zero'),
  icon: z.string().optional(),
  imageUrl: z.string().url('imageUrl invalida').optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
