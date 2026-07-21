import { describe, expect, it } from 'vitest';

import { getCanonicalProductHandle } from '@/lib/product-links';

describe('getCanonicalProductHandle', () => {
  it('keeps storefront slugs', () => {
    expect(getCanonicalProductHandle('kantha-jacket')).toBe('kantha-jacket');
  });

  it('drops product id fallbacks that would 404 as PDP routes', () => {
    expect(getCanonicalProductHandle('prod_1')).toBeUndefined();
    expect(
      getCanonicalProductHandle('550e8400-e29b-41d4-a716-446655440000')
    ).toBeUndefined();
  });
});
