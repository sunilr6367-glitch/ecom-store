import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'My Account | Odhvica',
  description:
    'Manage orders, saved addresses, messages, and account details for your Odhvica purchases.',
  path: '/account',
  keywords: ['Odhvica account', 'order history', 'saved addresses'],
});

export default function AccountLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
