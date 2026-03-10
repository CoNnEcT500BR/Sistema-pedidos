import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Senha obrigatoria'),
});

export type LoginInput = z.infer<typeof loginSchema>;

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
