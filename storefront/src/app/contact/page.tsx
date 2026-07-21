import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHero } from '@/components/content/ContentPageSystem';
import { ContactClient } from './ContactClient';
import { buildBasicPageMetadata, SITE_NAME } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: `Contact ${SITE_NAME} | Customer Support`,
  description: `Contact ${SITE_NAME} for product questions, order tracking, payment help, and returns.`,
  path: '/contact',
  keywords: [`${SITE_NAME} contact`, `${SITE_NAME} support`],
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Concierge"
        title={`Contact ${SITE_NAME}`}
        intro="Questions about sizing, payments, order tracking, returns, or atelier visits reach the same Jaipur support desk."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Contact' },
        ]}
      />
      <Suspense
        fallback={<div className="min-h-screen bg-surface-paper py-token-xl md:py-token-2xl lg:py-token-3xl" />}
      >
        <ContactClient />
      </Suspense>
    </>
  );
}
