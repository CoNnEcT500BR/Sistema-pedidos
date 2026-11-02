import { z } from 'zod';

export const INVENTORY_UNITS = ['UNIT', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER'] as const;

const inventoryUnitSchema = z.enum(INVENTORY_UNITS);

export const createInventoryIngredientSchema = z.object({
  name: z.string().trim().min(2).max(100),
  unit: inventoryUnitSchema,
  lowStockThreshold: z.number().min(0).optional(),
});

export const updateInventoryIngredientSchema = createInventoryIngredientSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo para atualizar');

export const countInventoryIngredientSchema = z.object({
  quantity: z.number().finite().min(0),
  note: z.string().trim().max(500).optional(),
});

export type CreateInventoryIngredientInput = z.infer<typeof createInventoryIngredientSchema>;
export type UpdateInventoryIngredientInput = z.infer<typeof updateInventoryIngredientSchema>;
export type CountInventoryIngredientInput = z.infer<typeof countInventoryIngredientSchema>;
