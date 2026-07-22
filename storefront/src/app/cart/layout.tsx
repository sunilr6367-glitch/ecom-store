import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Cart | Store',
  description:
    'Review your Store cart, shipping guidance, and payment help before checkout.',
  path: '/cart',
  keywords: ['Store cart'],
});

export default function CartLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
