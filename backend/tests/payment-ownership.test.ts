import { describe, expect, it } from 'vitest';

import {
  buildCheckoutPaymentTokenMetadata,
  generateCheckoutPaymentToken,
  isValidCheckoutPaymentToken,
} from '../src/utils/payment-ownership';

describe('checkout payment ownership tokens', () => {
  it('validates the generated token against stored metadata', () => {
    const token = generateCheckoutPaymentToken();
    const metadata = buildCheckoutPaymentTokenMetadata(token);

    expect(isValidCheckoutPaymentToken(metadata, token)).toBe(true);
  });

  it('rejects a different token', () => {
    const metadata = buildCheckoutPaymentTokenMetadata(generateCheckoutPaymentToken());

    expect(isValidCheckoutPaymentToken(metadata, generateCheckoutPaymentToken())).toBe(false);
  });

  it('rejects expired token metadata', () => {
    const token = generateCheckoutPaymentToken();
    const metadata = {
      ...buildCheckoutPaymentTokenMetadata(token),
      checkout_payment_token_expires_at: new Date(Date.now() - 1000).toISOString(),
    };

    expect(isValidCheckoutPaymentToken(metadata, token)).toBe(false);
  });
});
