import type { MetadataRoute } from 'next';

import { adminBrandConfig } from '@/config/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: adminBrandConfig.adminTitle,
    short_name: adminBrandConfig.storeName,
    description: `${adminBrandConfig.storeName} ecommerce administration`,
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    categories: ['business', 'productivity'],
  };
}
