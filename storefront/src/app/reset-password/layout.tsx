import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Reset Password | Odhvica',
  description: 'Reset your Odhvica account password securely.',
  path: '/reset-password',
  keywords: ['Odhvica reset password'],
});

export default function ResetPasswordLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
