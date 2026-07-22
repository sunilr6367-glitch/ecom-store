import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Checkout | Store',
  description:
    'Complete secure checkout for your Store order with region-appropriate payment methods.',
  path: '/checkout',
  keywords: ['Store checkout', 'Razorpay checkout'],
});

export default function CheckoutLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
