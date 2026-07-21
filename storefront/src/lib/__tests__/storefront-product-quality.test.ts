import { describe, expect, it } from 'vitest';
import type { Product } from '@/types';
import {
  filterStorefrontReadyProducts,
  getProductPrimaryImage,
  getProductReadinessWarnings,
  getStorefrontReadinessScore,
  isStorefrontProductReady,
} from '@/lib/storefront-product-quality';

const readyProduct: Product = {
  id: 'prod_1',
  title: 'Kantha Quilted Jacket',
  description: 'Handmade jacket',
  handle: 'kantha-quilted-jacket',
  status: 'published',
  thumbnail: 'https://example.com/jacket.jpg',
  variants: [
    {
      id: 'var_1',
      title: 'Default',
      inventory_quantity: 3,
      prices: [{ id: 'price_1', currency_code: 'inr', amount: 249900 }],
    },
  ],
  created_at: '2026-05-19T00:00:00.000Z',
};

describe('storefront product quality gate', () => {
  it('allows complete sellable products', () => {
    expect(isStorefrontProductReady(readyProduct)).toBe(true);
  });

  it('blocks placeholder, image-less, and price-less products', () => {
    const products = [
      readyProduct,
      { ...readyProduct, id: 'prod_2', title: 'Test product' },
      { ...readyProduct, id: 'prod_3', thumbnail: null, images: [] },
      { ...readyProduct, id: 'prod_4', variants: [] },
      { ...readyProduct, id: 'prod_5', title: 'Demo jacket' },
      {
        ...readyProduct,
        id: 'prod_6',
        variants: [{ ...readyProduct.variants![0], id: '' }],
      },
    ];

    expect(filterStorefrontReadyProducts(products)).toEqual([readyProduct]);
  });

  it('falls back to gallery media when thumbnail is missing', () => {
    expect(
      getProductPrimaryImage({
        ...readyProduct,
        thumbnail: null,
        images: [{ id: 'img_1', url: 'https://example.com/gallery.jpg' }],
      })
    ).toBe('https://example.com/gallery.jpg');
  });

  it('returns admin-friendly readiness warnings', () => {
    expect(
      getProductReadinessWarnings({
        ...readyProduct,
        title: 'Dummy item',
        thumbnail: null,
        images: [],
        variants: [],
      })
    ).toEqual(['placeholder title', 'missing image', 'missing sellable price']);
  });

  it('scores storefront readiness for admin publish checks', () => {
    expect(getStorefrontReadinessScore(readyProduct)).toBeGreaterThanOrEqual(75);
    expect(
      getStorefrontReadinessScore({
        ...readyProduct,
        status: 'draft',
        title: 'Test product',
        thumbnail: null,
        variants: [],
      })
    ).toBeLessThan(60);
  });
});
