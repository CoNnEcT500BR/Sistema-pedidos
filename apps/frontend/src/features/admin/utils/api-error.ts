import { isAxiosError } from 'axios';

export interface ApiErrorRule {
  includes: string[];
  message: string;
  matchMode?: 'all' | 'any';
}

export function normalizeApiMessage(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesRule(message: string, rule: ApiErrorRule): boolean {
  if (!rule.includes.length) return false;

  if (rule.matchMode === 'all') {
    return rule.includes.every((fragment) => message.includes(fragment));
  }

  return rule.includes.some((fragment) => message.includes(fragment));
}

export function resolveApiErrorMessage(
  err: unknown,
  fallbackMessage: string,
  t: (key: string) => string,
  rules: ApiErrorRule[] = [],
): string {
  if (!isAxiosError(err)) {
    return t(fallbackMessage);
  }

  const backendMessageRaw = err.response?.data?.message;
  if (typeof backendMessageRaw !== 'string' || !backendMessageRaw.trim()) {
    return t(fallbackMessage);
  }

  const backendMessage = normalizeApiMessage(backendMessageRaw);

  for (const rule of rules) {
    if (matchesRule(backendMessage, rule)) {
      return t(rule.message);
    }
  }

  return t(backendMessageRaw);
}
