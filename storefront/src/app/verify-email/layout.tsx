import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Verify Email | Odhvica',
  description: 'Verify your email address to activate your Odhvica account.',
  path: '/verify-email',
  keywords: ['Odhvica verify email'],
});

export default function VerifyEmailLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
