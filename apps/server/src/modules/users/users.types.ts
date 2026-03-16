import { z } from 'zod';

const roleSchema = z.enum(['ADMIN', 'STAFF']);

export const createUserSchema = z.object({
  email: z.string().email('email invalido'),
  password: z.string().min(6, 'password deve ter ao menos 6 caracteres'),
  role: roleSchema,
  name: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z
  .object({
    email: z.string().email('email invalido').optional(),
    password: z.string().min(6, 'password deve ter ao menos 6 caracteres').optional(),
    role: roleSchema.optional(),
    name: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo para atualizar');

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
