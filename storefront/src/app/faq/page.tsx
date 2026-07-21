import type { Metadata } from 'next';
import Link from 'next/link';

import {
  ContentContainer,
  FAQAccordion,
  InlineCTA,
  PageHero,
  SectionBlock,
} from '@/components/content/ContentPageSystem';
import { storefrontFaqs, storefrontTrust } from '@/config/storefront-trust';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Frequently Asked Questions | Odhvica',
  description:
    'Answers to common Odhvica questions about payments, shipping, returns, order tracking, and customer support.',
  path: '/faq',
  keywords: ['Odhvica FAQ', 'Odhvica shipping', 'Odhvica returns'],
});

export default function FAQPage() {
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: storefrontFaqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'FAQ', path: '/faq' },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />
      <PageHero
        eyebrow="Customer Care"
        title="Frequently Asked Questions"
        intro="Clear answers for payments, delivery timelines, returns, order tracking, and reaching the Odhvica support team."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'FAQ' },
        ]}
      />
      <ContentContainer
        footer={
          <InlineCTA
            title="Could not find the answer?"
            body="Start with the help center or contact support with your order reference so we can resolve it cleanly."
            links={[
              { label: 'Help Center', href: storefrontTrust.policyRoutes.help },
              {
                label: 'Contact Support',
                href: storefrontTrust.policyRoutes.contact,
                variant: 'primary',
              },
            ]}
          />
        }
      >
        <SectionBlock
          title="Common Questions"
          intro="Tap a question to open the answer. Each answer links back into the policy and support routes where needed."
        >
          <FAQAccordion items={storefrontFaqs} />
        </SectionBlock>
        <div className="info-grid">
          <Link href={storefrontTrust.policyRoutes.shipping} className="info-card info-card--link">
            <p className="info-card__eyebrow">Delivery</p>
            <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">Shipping Policy</h3>
            <div className="info-card__body">Timelines, charges, international shipping, and tracking guidance.</div>
            <span className="info-card__cta">Read policy</span>
          </Link>
          <Link href={storefrontTrust.policyRoutes.returns} className="info-card info-card--link">
            <p className="info-card__eyebrow">After Purchase</p>
            <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">Returns Help</h3>
            <div className="info-card__body">Eligibility, refunds, exchanges, and how to start a request.</div>
            <span className="info-card__cta">Open returns</span>
          </Link>
          <Link href={storefrontTrust.policyRoutes.paymentHelp} className="info-card info-card--link">
            <p className="info-card__eyebrow">Checkout</p>
            <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">Payment Help</h3>
            <div className="info-card__body">Razorpay, PayPal, failed attempts, and safe retry guidance.</div>
            <span className="info-card__cta">Get help</span>
          </Link>
        </div>
      </ContentContainer>
    </>
  );
}

