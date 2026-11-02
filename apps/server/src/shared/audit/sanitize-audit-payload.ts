const sensitiveKeyPattern = /password|passphrase|token|secret|authorization|cookie|api[-_]?key/i;

export function sanitizeAuditPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.map((value) => sanitizeAuditPayload(value));
  }

  if (payload === null || typeof payload !== 'object') {
    return payload;
  }

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : sanitizeAuditPayload(value),
    ]),
  );
}
