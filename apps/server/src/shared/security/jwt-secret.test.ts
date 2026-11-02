import assert from 'node:assert/strict';
import test from 'node:test';
import { requireJwtSecret } from './jwt-secret.js';

test('requires a configured secret with at least 32 bytes', () => {
  assert.throws(() => requireJwtSecret(undefined), /JWT_SECRET must be explicitly configured/);
  assert.throws(() => requireJwtSecret('short'), /at least 32 bytes/);
});

test('rejects the previous public fallback secret', () => {
  assert.throws(
    () => requireJwtSecret('dev-secret-key-change-in-production'),
    /unique secret of at least 32 bytes/,
  );
});

test('accepts a sufficiently long configured secret', () => {
  const secret = 'unique-local-test-secret-with-enough-bytes-123';
  assert.equal(requireJwtSecret(secret), secret);
});
