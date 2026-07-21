import { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/cart',
          '/checkout',
          '/account',
          '/search',
          '/api',
          '/*?sort=',
          '/*?price=',
          '/*?min_price=',
          '/*?max_price=',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
