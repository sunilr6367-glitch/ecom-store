import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Checkout | Odhvica',
  description:
    'Complete secure checkout for your Odhvica order with region-appropriate payment methods.',
  path: '/checkout',
  keywords: ['Odhvica checkout', 'Razorpay checkout'],
});

export default function CheckoutLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
