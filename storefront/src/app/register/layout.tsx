import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Create Account | Store',
  description:
    'Create a Store account to track orders, save addresses, and manage post-purchase support.',
  path: '/register',
  keywords: ['Store register', 'create account'],
});

export default function RegisterLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
