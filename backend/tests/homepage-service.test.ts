import { describe, expect, it } from 'vitest';
import {
  compareBestSellerRows,
  dedupeCampaignProductIds,
  isQualifyingBestSellerOrder,
} from '../src/services/homepage-service';

describe('homepage campaign deduplication', () => {
  it('removes bestseller products, duplicates, and respects the preview limit', () => {
    const result = dedupeCampaignProductIds(
      ['p1', 'p2', 'p2', 'p3', 'p4', 'p5'],
      new Set(['p1', 'p4']),
      3
    );

    expect(result).toEqual(['p2', 'p3', 'p5']);
  });

  it('returns an empty preview when every curated product is a bestseller', () => {
    expect(
      dedupeCampaignProductIds(['p1', 'p2'], new Set(['p1', 'p2']))
    ).toEqual([]);
  });
});

describe('homepage best seller rules', () => {
  it('only accepts captured, non-canceled orders', () => {
    expect(
      isQualifyingBestSellerOrder({ payment_status: 'captured', status: 'completed' })
    ).toBe(true);
    expect(
      isQualifyingBestSellerOrder({ payment_status: 'awaiting', status: 'completed' })
    ).toBe(false);
    expect(
      isQualifyingBestSellerOrder({ payment_status: 'refunded', status: 'completed' })
    ).toBe(false);
    expect(
      isQualifyingBestSellerOrder({ payment_status: 'captured', status: 'canceled' })
    ).toBe(false);
  });

  it('ranks by units, latest sale, then stable product id', () => {
    const rows = [
      { product_id: 'b', units_sold: 5, latest_sale_at: new Date('2026-01-01') },
      { product_id: 'a', units_sold: 5, latest_sale_at: new Date('2026-01-01') },
      { product_id: 'c', units_sold: 3, latest_sale_at: new Date('2026-06-01') },
      { product_id: 'd', units_sold: 5, latest_sale_at: new Date('2026-02-01') },
    ];

    expect(rows.sort(compareBestSellerRows).map((row) => row.product_id)).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
  });
});
