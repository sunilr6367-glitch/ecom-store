import { describe, expect, it } from 'vitest';
import {
  getSelectableRegions,
  resolveRegionForCountry,
  StoreRegion,
} from '@/lib/regions';

const regions: StoreRegion[] = [
  {
    id: 'india',
    name: 'India',
    currency_code: 'inr',
    tax_rate: 18,
    countries: ['IN'],
    metadata: { checkout_enabled: true, market_key: 'india' },
  },
  {
    id: 'europe',
    name: 'Europe',
    currency_code: 'eur',
    tax_rate: 20,
    countries: ['DE', 'FR'],
    metadata: { checkout_enabled: true, market_key: 'europe' },
  },
  {
    id: 'row',
    name: 'Rest of World',
    currency_code: 'usd',
    tax_rate: 0,
    countries: [],
    metadata: {
      checkout_enabled: true,
      market_key: 'rest-of-world',
      catchall: true,
    },
  },
  {
    id: 'legacy',
    name: 'Legacy Canada',
    currency_code: 'cad',
    tax_rate: 0,
    metadata: { checkout_enabled: false },
  },
];

describe('region resolution', () => {
  it('exposes only checkout-enabled regions when configured', () => {
    expect(getSelectableRegions(regions).map((region) => region.id)).toEqual([
      'india',
      'europe',
      'row',
    ]);
  });

  it('uses an exact country mapping before the catchall', () => {
    expect(resolveRegionForCountry(regions, 'fr')?.id).toBe('europe');
  });

  it('uses Rest of World for an unmapped country', () => {
    expect(resolveRegionForCountry(regions, 'CA')?.id).toBe('row');
  });
});
