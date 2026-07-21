import crypto from 'crypto';
import { getInventoryReservationTtlMs } from './inventory-reservation';

export type PaymentOwnershipMetadata = Record<string, any> & {
  checkout_payment_token_hash?: string;
  checkout_payment_token_issued_at?: string;
  checkout_payment_token_expires_at?: string;
};

export function generateCheckoutPaymentToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashCheckoutPaymentToken(token: string) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function buildCheckoutPaymentTokenMetadata(token: string) {
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + getInventoryReservationTtlMs()
  );

  return {
    checkout_payment_token_hash: hashCheckoutPaymentToken(token),
    checkout_payment_token_issued_at: issuedAt.toISOString(),
    checkout_payment_token_expires_at: expiresAt.toISOString(),
  };
}

export function isValidCheckoutPaymentToken(
  metadata: PaymentOwnershipMetadata | null | undefined,
  token: string | null | undefined
) {
  if (!metadata || !token) return false;

  const expectedHash = metadata.checkout_payment_token_hash;
  if (!expectedHash || typeof expectedHash !== 'string') return false;

  const expiresAt = metadata.checkout_payment_token_expires_at
    ? new Date(metadata.checkout_payment_token_expires_at)
    : null;
  if (expiresAt && Number.isFinite(expiresAt.getTime()) && expiresAt < new Date()) {
    return false;
  }

  const actualHash = hashCheckoutPaymentToken(token);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}
