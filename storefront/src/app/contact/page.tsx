import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageHero } from '@/components/content/ContentPageSystem';
import { ContactClient } from './ContactClient';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Contact Odhvica | Customer Support & Jaipur Atelier',
  description:
    'Contact Odhvica for sizing questions, order tracking, payment help, returns, WhatsApp support, and Jaipur atelier enquiries.',
  path: '/contact',
  keywords: ['Odhvica contact', 'Odhvica support', 'Odhvica WhatsApp'],
});

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Concierge"
        title="Contact Odhvica"
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
