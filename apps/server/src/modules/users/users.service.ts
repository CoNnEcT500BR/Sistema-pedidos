import bcrypt from 'bcryptjs';

import { prisma } from '@/shared/database/prisma.client';
import type { CreateUserInput, UpdateUserInput } from './users.types';

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
    const password = await bcrypt.hash(payload.password, 10);
    return prisma.user.create({
      data: {
        email: payload.email,
        password,
        role: payload.role,
        name: payload.name,
        isActive: payload.isActive ?? true,
      },
      select: userSelect,
    });
  },

  updateUser: async (id: string, payload: UpdateUserInput) => {
    const data: Record<string, unknown> = { ...payload };
    if (payload.password) {
      data.password = await bcrypt.hash(payload.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  },

  updateStatus: async (id: string, isActive: boolean) =>
    prisma.user.update({
      where: { id },
      data: { isActive },
      select: userSelect,
    }),

  deleteUser: async (id: string, actorId: string) => {
    if (id === actorId) {
      throw new Error('Nao e permitido remover a propria conta');
    }

    return prisma.user.delete({
      where: { id },
      select: userSelect,
    });
  },
};
