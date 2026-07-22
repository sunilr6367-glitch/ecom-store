import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Login | Store',
  description: 'Sign in to your Store account to view orders and manage support.',
  path: '/login',
  keywords: ['Store login'],
});

export default function LoginLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
