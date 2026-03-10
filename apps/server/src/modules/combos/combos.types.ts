import { z } from 'zod';

const comboItemInputSchema = z.object({
  menuItemId: z.string().min(1, 'menuItemId obrigatorio'),
  quantity: z.number().int().min(1, 'quantity deve ser >= 1').default(1),
});

export const createComboSchema = z.object({
  name: z.string().min(2, 'name obrigatorio'),
  description: z.string().optional(),
  price: z.number().positive('price deve ser maior que zero'),
  icon: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  comboItems: z.array(comboItemInputSchema).min(1, 'comboItems obrigatorio'),
});

export const updateComboSchema = z
  .object({
    name: z.string().min(2, 'name obrigatorio').optional(),
    description: z.string().optional(),
    price: z.number().positive('price deve ser maior que zero').optional(),
    icon: z.string().optional(),
    displayOrder: z.number().int().min(0).optional(),
    comboItems: z.array(comboItemInputSchema).min(1, 'comboItems invalido').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Payload invalido',
  });

export const updateComboAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type CreateComboInput = z.infer<typeof createComboSchema>;
export type UpdateComboInput = z.infer<typeof updateComboSchema>;
