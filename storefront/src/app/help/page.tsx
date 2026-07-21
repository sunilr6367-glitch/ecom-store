import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, LifeBuoy, PackageSearch, RotateCcw } from 'lucide-react';

import {
  ContentContainer,
  InfoCard,
  PageHero,
  SectionBlock,
} from '@/components/content/ContentPageSystem';
import { storefrontTrust } from '@/config/storefront-trust';
import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Help Center | Odhvica',
  description:
    'Use the Odhvica Help Center to track orders, resolve payment issues, understand returns, and reach support quickly.',
  path: '/help',
  keywords: ['Odhvica help center', 'order support', 'payment help'],
});

const helpCards = [
  {
    title: 'Track an order',
    description:
      'Check live order status, shipment milestones, and delivery updates using your order ID and email address.',
    href: storefrontTrust.policyRoutes.track,
    cta: 'Track Order',
    icon: PackageSearch,
  },
  {
    title: 'Resolve payment issues',
    description:
      'Use the payment-help route if a Razorpay or PayPal attempt fails or if you are unsure whether you were charged.',
    href: storefrontTrust.policyRoutes.paymentHelp,
    cta: 'Payment Help',
    icon: CreditCard,
  },
  {
    title: 'Returns and refunds',
    description:
      'Review return guidance, refund rules, and your existing return activity before contacting the team.',
    href: storefrontTrust.policyRoutes.returns,
    cta: 'Returns Help',
    icon: RotateCcw,
  },
  {
    title: 'Contact support directly',
    description:
      'If you already know what you need, send a structured support request with your order reference and issue.',
    href: storefrontTrust.policyRoutes.contact,
    cta: 'Contact Support',
    icon: LifeBuoy,
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Support Hub"
        title="Odhvica Help Center"
        intro="Start here for order tracking, payment recovery, return guidance, and direct support without bouncing between policy pages."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Help Center' },
        ]}
      />
      <ContentContainer>
        <SectionBlock title="Choose a Support Path">
          <div className="grid gap-5 md:grid-cols-2">
          {helpCards.map(({ title, description, href, cta, icon: Icon }) => (
            <Link key={title} href={href} className="info-card info-card--link">
              <Icon className="text-primary" size={26} />
              <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">{title}</h3>
              <div className="info-card__body">{description}</div>
              <span className="info-card__cta">{cta}</span>
            </Link>
          ))}
          </div>
        </SectionBlock>

        <SectionBlock title="Before You Contact Support">
          <ul className="editorial-text">
            <li>Keep your order reference and purchase email ready.</li>
            <li>Do not retry payment blindly if you are unsure whether it failed.</li>
            <li>Review shipping and refund guidance before assuming eligibility.</li>
            <li>Use the order tracking route first for shipment-status questions.</li>
          </ul>
          <div className="mt-8">
            <InfoCard
              title="Prefer direct help?"
              eyebrow="Concierge"
              href={storefrontTrust.policyRoutes.contact}
              cta="Contact Support"
            >
              Send a structured message with your issue and order details.
            </InfoCard>
          </div>
        </SectionBlock>
      </ContentContainer>
    </>
  );
}
