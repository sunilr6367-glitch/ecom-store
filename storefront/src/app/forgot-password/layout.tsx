import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Forgot Password | Store',
  description: 'Request a password reset link for your Store account.',
  path: '/forgot-password',
  keywords: ['Store forgot password'],
});

export default function ForgotPasswordLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
