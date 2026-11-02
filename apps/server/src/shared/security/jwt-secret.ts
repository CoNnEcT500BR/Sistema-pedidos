const minimumJwtSecretBytes = 32;
const publicJwtSecret = 'dev-secret-key-change-in-production';

export function requireJwtSecret(secret: string | undefined): string {
  if (
    !secret ||
    secret.trim().length === 0 ||
    Buffer.byteLength(secret, 'utf8') < minimumJwtSecretBytes ||
    secret === publicJwtSecret
  ) {
    throw new Error(
      'JWT_SECRET must be explicitly configured with a unique secret of at least 32 bytes.',
    );
  }

  return secret;
}
