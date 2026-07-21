import { describe, expect, it } from 'vitest';

import {
  buildInventoryReservationMetadata,
  isInventoryReservationActive,
} from '../src/utils/inventory-reservation';
import {
  buildCheckoutPaymentTokenMetadata,
  isValidCheckoutPaymentToken,
} from '../src/utils/payment-ownership';
import { sanitizeCmsHtml } from '../src/utils/sanitize-html';
import { applyOrderDiscountToRefund } from '../src/utils/return-validation';

describe('critical security regressions', () => {
  it('binds checkout payment access to the opaque token', () => {
    const token = 'opaque-checkout-token-1234567890';
    const metadata = buildCheckoutPaymentTokenMetadata(token);

    expect(isValidCheckoutPaymentToken(metadata, token)).toBe(true);
    expect(isValidCheckoutPaymentToken(metadata, 'different-token-123456')).toBe(
      false
    );
  });

  it('rejects released or expired inventory reservations', () => {
    const active = buildInventoryReservationMetadata(new Date());
    expect(isInventoryReservationActive(active)).toBe(true);
    expect(
      isInventoryReservationActive({
        ...active,
        inventory_reservation_released_at: new Date().toISOString(),
      })
    ).toBe(false);
    expect(
      isInventoryReservationActive({
        inventory_reservation_expires_at: '2020-01-01T00:00:00.000Z',
      })
    ).toBe(false);
  });

  it('removes executable CMS markup and unsafe URL schemes', () => {
    const sanitized = sanitizeCmsHtml(
      '<script>alert(1)</script><p onclick="alert(2)">Hello <a href="javascript:alert(3)">link</a></p>'
    );

    expect(sanitized).toBe('<p>Hello <a>link</a></p>');
    expect(sanitized).not.toContain('script');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).not.toContain('javascript:');
  });

  it('does not refund the discounted portion of returned merchandise', () => {
    expect(applyOrderDiscountToRefund(5_000, 10_000, 2_000)).toBe(4_000);
    expect(applyOrderDiscountToRefund(5_000, 10_000, 0)).toBe(5_000);
  });
});
