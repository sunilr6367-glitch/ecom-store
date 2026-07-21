import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Cart | Odhvica',
  description:
    'Review your Odhvica cart, shipping guidance, and payment help before checkout.',
  path: '/cart',
  keywords: ['Odhvica cart'],
});

export default function CartLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
