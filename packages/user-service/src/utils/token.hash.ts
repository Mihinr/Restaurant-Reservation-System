import crypto from 'crypto';

/**
 * Creates a deterministic hash of a token for database storage and lookup.
 * Unlike passwords, tokens are already high-entropy strings, so a fast
 * cryptographic hash like SHA-256 is sufficient and allows for direct lookups.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
