import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email invalido')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Senha obrigatoria'),
});

export const unlockRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Email invalido')
    .transform((value) => value.toLowerCase()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UnlockRequestInput = z.infer<typeof unlockRequestSchema>;

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  name: string | null;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}
