import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'My Account | Store',
  description:
    'Manage orders, saved addresses, messages, and account details for your Store purchases.',
  path: '/account',
  keywords: ['Store account', 'order history', 'saved addresses'],
});

export default function AccountLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
