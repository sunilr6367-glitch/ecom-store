import type { Metadata } from 'next';

import {
  ContentContainer,
  HighlightBox,
  InfoCard,
  InlineCTA,
  PageHero,
  SectionBlock,
} from '@/components/content/ContentPageSystem';
import { ButtonLink } from '@/design-system';
import { storefrontTrust } from '@/config/storefront-trust';
import { buildNoindexPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildNoindexPageMetadata({
  title: 'Payment Help | Odhvica',
  description:
    'Get help if a Razorpay or PayPal payment attempt fails or if you need to confirm whether your order was charged.',
  path: '/payment-help',
  keywords: ['Odhvica payment help', 'Razorpay support', 'order charged'],
});

export default function PaymentHelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Payment Support"
        title="Trouble Completing Payment?"
        intro="Use this page if a Razorpay or PayPal attempt fails, or if you are unsure whether your order was charged successfully."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Payment Help' },
        ]}
      />
      <ContentContainer
        footer={
          <InlineCTA
            title="Still unsure after checking?"
            body="Share your order reference, payment timestamp, and payment method so support can verify the attempt safely."
            links={[
              { label: 'Track Order', href: storefrontTrust.policyRoutes.track },
              {
                label: 'Contact Support',
                href: `${storefrontTrust.policyRoutes.contact}?reason=payment`,
                variant: 'primary',
              },
            ]}
          />
        }
      >
        <SectionBlock title="Payment Recovery Steps">
          <div className="info-grid">
            <InfoCard title="Do not retry blindly" eyebrow="Step 01">
              First confirm whether a payment failed or is still being processed
              to avoid duplicate attempts.
            </InfoCard>
            <InfoCard title="Check your order status" eyebrow="Step 02">
              Use your order reference and email on the track page if an order
              was created before the payment issue happened.
            </InfoCard>
            <InfoCard title="Contact support" eyebrow="Step 03">
              Share the order reference, payment timestamp, and method used so
              the team can verify it cleanly.
            </InfoCard>
          </div>
        </SectionBlock>

        <SectionBlock title="Accepted Payment Guidance">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="India (INR)" eyebrow="Razorpay">
              {storefrontTrust.paymentMethodsIndia}
            </InfoCard>
            <InfoCard title="International Buyers" eyebrow="PayPal">
              {storefrontTrust.paymentMethodsInternational}
            </InfoCard>
          </div>
          <HighlightBox title="International checkout note">
            PayPal is available for international buyers only.
          </HighlightBox>
          <ButtonLink href={storefrontTrust.policyRoutes.terms} variant="outline" size="md">
            Review Terms
          </ButtonLink>
        </SectionBlock>
      </ContentContainer>
    </>
  );
}
