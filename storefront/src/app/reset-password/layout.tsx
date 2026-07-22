import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Reset Password | Store',
  description: 'Reset your Store account password securely.',
  path: '/reset-password',
  keywords: ['Store reset password'],
});

export default function ResetPasswordLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
