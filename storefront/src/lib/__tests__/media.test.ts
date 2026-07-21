import { describe, expect, it } from 'vitest';
import { cloudinaryImageLoader } from '@/lib/media';

describe('cloudinaryImageLoader', () => {
  it('adds responsive width, automatic format, and automatic quality', () => {
    expect(
      cloudinaryImageLoader({
        src: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        width: 960,
        quality: 80,
      })
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_960,c_limit/sample.jpg'
    );
  });

  it('does not rewrite non-Cloudinary sources', () => {
    expect(
      cloudinaryImageLoader({ src: '/images/local.jpg', width: 640 })
    ).toBe('/images/local.jpg');
  });
});
