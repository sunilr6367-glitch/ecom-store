import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Track Order | Store',
  description:
    'Track an existing Store order and reach support quickly if you need payment or delivery help.',
  path: '/track',
  keywords: ['Store track order'],
});

export default function TrackLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
