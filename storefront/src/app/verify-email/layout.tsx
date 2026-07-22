import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Verify Email | Store',
  description: 'Verify your email address to activate your Store account.',
  path: '/verify-email',
  keywords: ['Store verify email'],
});

export default function VerifyEmailLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
