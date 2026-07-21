import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Returns & Refunds Help | Odhvica',
  description:
    'Read Odhvica return guidance, check request status, and reach support for eligible return or refund help.',
  path: '/returns',
  keywords: ['Odhvica returns', 'refund help'],
});

export default function ReturnsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
