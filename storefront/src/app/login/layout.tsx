import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Login | Odhvica',
  description: 'Sign in to your Odhvica account to view orders and manage support.',
  path: '/login',
  keywords: ['Odhvica login'],
});

export default function LoginLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
