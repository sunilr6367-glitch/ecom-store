import { describe, expect, it } from 'vitest';

import { CreateProductSchema } from '../src/services/product/product-validator';

const baseProduct = {
  title: 'Mulmul Kurta',
  handle: 'mulmul-kurta',
};

describe('product validator media URLs', () => {
  it('accepts Cloudinary URLs and relative upload paths', () => {
    const result = CreateProductSchema.safeParse({
      ...baseProduct,
      thumbnail: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      images: [
        {
          url: '/uploads/local-preview.jpg',
          metadata: {
            media_type: 'image',
            thumbnail_url: '/uploads/local-preview.jpg',
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('strips empty optional thumbnail URLs from product media metadata', () => {
    const result = CreateProductSchema.safeParse({
      ...baseProduct,
      thumbnail: '',
      images: [
        {
          url: 'https://res.cloudinary.com/demo/video/upload/sample.mp4',
          metadata: {
            media_type: 'video',
            thumbnail_url: '',
          },
        },
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.thumbnail).toBeUndefined();
    expect(result.data.images?.[0]?.metadata?.thumbnail_url).toBeUndefined();
  });
});
