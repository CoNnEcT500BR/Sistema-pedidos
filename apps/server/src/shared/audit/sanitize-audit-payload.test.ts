import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeAuditPayload } from './sanitize-audit-payload.js';

test('redacts sensitive values recursively without mutating the payload', () => {
  const payload = {
    email: 'staff@example.test',
    password: 'plain-secret',
    profile: {
      newPassword: 'new-secret',
      api_key: 'api-secret',
      preferences: [{ accessToken: 'token-secret', theme: 'dark' }],
    },
  };

  assert.deepEqual(sanitizeAuditPayload(payload), {
    email: 'staff@example.test',
    password: '[REDACTED]',
    profile: {
      newPassword: '[REDACTED]',
      api_key: '[REDACTED]',
      preferences: [{ accessToken: '[REDACTED]', theme: 'dark' }],
    },
  });
  assert.equal(payload.password, 'plain-secret');
});

test('preserves non-object and null payloads', () => {
  assert.equal(sanitizeAuditPayload(null), null);
  assert.equal(sanitizeAuditPayload('safe'), 'safe');
});
