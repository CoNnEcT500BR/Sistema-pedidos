import { prisma } from '@/shared/database/prismaClient.js';

const BASE_BLOCK_MS = 60_000;
const MAX_BLOCK_MS = 30 * 60_000;
const FAILURE_THRESHOLD = 3;

function nowMs(): number {
  return Date.now();
}

function getRetryAfterSec(lockedUntil: Date): number {
  return Math.max(1, Math.ceil((lockedUntil.getTime() - nowMs()) / 1000));
}

function getBlockDuration(failedAttempts: number): number {
  const exponent = Math.min(Math.max(failedAttempts - FAILURE_THRESHOLD, 0), 6);
  return Math.min(BASE_BLOCK_MS * 2 ** exponent, MAX_BLOCK_MS);
}

export const authLockout = {
  async isBlocked(
    email: string,
    _ip: string,
  ): Promise<{ blocked: boolean; retryAfterSec: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });

    if (!user?.lockedUntil) {
      return { blocked: false, retryAfterSec: 0 };
    }

    const lockedUntil = new Date(user.lockedUntil);
    if (lockedUntil <= new Date()) {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      return { blocked: false, retryAfterSec: 0 };
    }

    return {
      blocked: true,
      retryAfterSec: getRetryAfterSec(lockedUntil),
    };
  },

  async registerFailure(email: string, _ip: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      return;
    }

    const nextFailedAttempts = user.failedLoginAttempts + 1;
    const nextLockedUntil =
      nextFailedAttempts >= FAILURE_THRESHOLD
        ? new Date(nowMs() + getBlockDuration(nextFailedAttempts))
        : null;

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        failedLoginAttempts: nextFailedAttempts,
        lockedUntil: nextLockedUntil,
      },
    });
  },

  async registerSuccess(email: string, _ip: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  },

  async reset(email: string, _ip: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await prisma.user.updateMany({
      where: { email: normalizedEmail },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  },
};
