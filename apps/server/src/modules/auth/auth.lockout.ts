interface AttemptEntry {
  failedCount: number;
  blockedUntil?: number;
  updatedAt: number;
}

const attempts = new Map<string, AttemptEntry>();
const BASE_BLOCK_MS = 60_000;
const MAX_BLOCK_MS = 30 * 60_000;

function now(): number {
  return Date.now();
}

function getKey(email: string, ip: string): string {
  return `${email.toLowerCase()}|${ip}`;
}

export const authLockout = {
  isBlocked(email: string, ip: string): { blocked: boolean; retryAfterSec: number } {
    const key = getKey(email, ip);
    const entry = attempts.get(key);
    if (!entry?.blockedUntil) {
      return { blocked: false, retryAfterSec: 0 };
    }

    if (entry.blockedUntil <= now()) {
      entry.blockedUntil = undefined;
      attempts.set(key, entry);
      return { blocked: false, retryAfterSec: 0 };
    }

    return {
      blocked: true,
      retryAfterSec: Math.ceil((entry.blockedUntil - now()) / 1000),
    };
  },

  registerFailure(email: string, ip: string): void {
    const key = getKey(email, ip);
    const entry = attempts.get(key) ?? { failedCount: 0, updatedAt: now() };

    entry.failedCount += 1;
    entry.updatedAt = now();

    if (entry.failedCount >= 3) {
      const exponent = Math.min(entry.failedCount - 3, 6);
      const blockDuration = Math.min(BASE_BLOCK_MS * 2 ** exponent, MAX_BLOCK_MS);
      entry.blockedUntil = now() + blockDuration;
    }

    attempts.set(key, entry);
  },

  registerSuccess(email: string, ip: string): void {
    attempts.delete(getKey(email, ip));
  },
};
