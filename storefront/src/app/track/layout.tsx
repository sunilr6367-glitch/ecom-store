import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Track Order | Odhvica',
  description:
    'Track an existing Odhvica order and reach support quickly if you need payment or delivery help.',
  path: '/track',
  keywords: ['Odhvica track order'],
});

export default function TrackLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
