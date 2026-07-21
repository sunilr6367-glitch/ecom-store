import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Create Account | Odhvica',
  description:
    'Create a Odhvica account to track orders, save addresses, and manage post-purchase support.',
  path: '/register',
  keywords: ['Odhvica register', 'create account'],
});

export default function RegisterLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
