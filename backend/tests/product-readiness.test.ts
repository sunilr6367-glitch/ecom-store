import { describe, expect, it } from 'vitest';

import { getNewProductPublishReadinessIssues } from '../src/services/product/product-readiness';
import type { CreateProductInput } from '../src/services/product/product-validator';

const readyProduct: CreateProductInput = {
  title: 'Kantha Quilted Jacket',
  handle: 'kantha-quilted-jacket',
  status: 'published',
  thumbnail: 'https://example.com/jacket.jpg',
  price_type: 'fixed',
  prices: [{ amount: 249900, currency_code: 'inr' }],
  category_ids: ['8b74623b-b5cb-4d10-bbaf-c8f1625d31aa'],
};

describe('product publish readiness', () => {
  it('allows complete fixed-price storefront products', () => {
    expect(getNewProductPublishReadinessIssues(readyProduct)).toEqual([]);
  });

  it('blocks placeholder titles, missing media, on-request pricing, and missing taxonomy', () => {
    const issues = getNewProductPublishReadinessIssues({
      ...readyProduct,
      title: 'Demo product',
      thumbnail: '',
      images: [],
      price_type: 'on_request',
      prices: [],
      category_ids: [],
      collection_id: null,
    });

    expect(issues.map((issue) => issue.field)).toEqual([
      'title',
      'images',
      'prices',
      'category_ids',
    ]);
  });
});
