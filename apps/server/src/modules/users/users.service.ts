import bcrypt from 'bcryptjs';

import { prisma } from '@/shared/database/prisma.client';
import type { CreateUserInput, UpdateUserInput } from './users.types';

class UsersServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function isUsersServiceError(error: unknown): error is UsersServiceError {
  return error instanceof UsersServiceError;
}

function isPrismaErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

const userSelect = {
  id: true,
  email: true,
  role: true,
  name: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const usersService = {
  listUsers: async () =>
    prisma.user.findMany({
      select: userSelect,
      orderBy: [{ role: 'asc' }, { name: 'asc' }, { email: 'asc' }],
    }),

  createUser: async (payload: CreateUserInput) => {
    try {
      const password = await bcrypt.hash(payload.password, 10);
      return await prisma.user.create({
        data: {
          email: payload.email,
          password,
          role: payload.role,
          name: payload.name,
          isActive: payload.isActive ?? true,
        },
        select: userSelect,
      });
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new UsersServiceError('Email ja cadastrado', 400);
      }

      throw error;
    }
  },

  updateUser: async (id: string, payload: UpdateUserInput) => {
    try {
      const data: Record<string, unknown> = { ...payload };
      if (payload.password) {
        data.password = await bcrypt.hash(payload.password, 10);
      }

      return await prisma.user.update({
        where: { id },
        data,
        select: userSelect,
      });
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new UsersServiceError('Email ja cadastrado', 400);
      }

      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new UsersServiceError('Usuario nao encontrado', 404);
      }

      throw error;
    }
  },

  updateStatus: async (id: string, isActive: boolean) => {
    try {
      return await prisma.user.update({
        where: { id },
        data: { isActive },
        select: userSelect,
      });
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new UsersServiceError('Usuario nao encontrado', 404);
      }

      throw error;
    }
  },

  deleteUser: async (id: string, actorId: string) => {
    if (id === actorId) {
      throw new Error('Nao e permitido remover a propria conta');
    }

    try {
      return await prisma.user.delete({
        where: { id },
        select: userSelect,
      });
    } catch (error) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new UsersServiceError('Usuario nao encontrado', 404);
      }

      throw error;
    }
  },
};
