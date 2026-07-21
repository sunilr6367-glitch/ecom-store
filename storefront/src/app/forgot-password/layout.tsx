import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Forgot Password | Odhvica',
  description: 'Request a password reset link for your Odhvica account.',
  path: '/forgot-password',
  keywords: ['Odhvica forgot password'],
});

export default function ForgotPasswordLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
