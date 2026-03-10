import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';

import { prisma } from '@/shared/database/prisma.client';
import type { LoginInput, LoginResult } from './auth.types';

class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function isPasswordValid(plainText: string, storedPassword: string): Promise<boolean> {
  if (
    storedPassword.startsWith('$2a$') ||
    storedPassword.startsWith('$2b$') ||
    storedPassword.startsWith('$2y$')
  ) {
    return bcrypt.compare(plainText, storedPassword);
  }

  // Backward-compatible fallback for legacy seed data.
  return plainText === storedPassword;
}

export async function login(app: FastifyInstance, payload: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      name: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AuthError('Credenciais invalidas', 401);
  }

  const validPassword = await isPasswordValid(payload.password, user.password);
  if (!validPassword) {
    throw new AuthError('Credenciais invalidas', 401);
  }

  const role = user.role === 'ADMIN' ? 'ADMIN' : 'STAFF';

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = await app.jwt.sign({
    sub: user.id,
    email: user.email,
    role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role,
      name: user.name,
    },
    token,
  };
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
