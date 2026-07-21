import { Globe, Clock } from 'lucide-react';

import {
  ContentContainer,
  InfoCard,
  InlineCTA,
  PageHero,
  SectionBlock,
} from '@/components/content/ContentPageSystem';
import { ButtonLink } from '@/design-system';
import { storefrontTrust } from '@/config/storefront-trust';

export default function ShippingPage() {
  return (
    <>
      <PageHero
        eyebrow="Global Fulfillment"
        title="Shipping & Delivery"
        intro="Shipping availability, rates, and delivery timing are confirmed through checkout and account tracking."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Shipping' },
        ]}
      />
      <ContentContainer
        footer={
          <InlineCTA
            title="Need shipping help?"
            body="Use the guided support routes for order tracking, refund guidance, and direct support."
            links={[
              { label: 'Help Center', href: storefrontTrust.policyRoutes.help },
              { label: 'Returns Help', href: storefrontTrust.policyRoutes.returns },
              {
                label: 'Contact Support',
                href: storefrontTrust.policyRoutes.contact,
                variant: 'primary',
              },
            ]}
          />
        }
      >
        <SectionBlock title="Shipping Overview">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Shipping availability" eyebrow="Regions">
              <div className="flex items-start gap-3">
                <Globe size={20} aria-hidden="true" />
                <p>{storefrontTrust.shippingSummary}</p>
              </div>
            </InfoCard>
            <InfoCard title="Delivery timing" eyebrow="Estimates">
              <div className="flex items-start gap-3">
                <Clock size={20} aria-hidden="true" />
                <p>
                  Delivery estimates vary by destination, stock position, and
                  the shipping method shown at checkout.
                </p>
              </div>
            </InfoCard>
          </div>
        </SectionBlock>

        <SectionBlock title="Shipping Details">
          <div className="editorial-text">
            <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">Shipping methods and rates</h3>
            <p>
            Shipping rates, taxes, and available methods are confirmed after
            you enter your delivery address during checkout. This protects
            buyers from seeing inaccurate hardcoded delivery promises.
            </p>

            <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">Processing</h3>
            <p>
            Order preparation time can vary by item availability, hand-finished
            processes, and order volume. Tracking details are shared once your
            order is dispatched.
            </p>

            <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">Duties, taxes, and region rules</h3>
            <p>
            Duties, import handling, and checkout taxes may vary by destination.
            The amount displayed during checkout should be treated as the final
            customer-facing payment summary for that order.
            </p>

            <h3 className="font-display text-display-sm text-primary mt-8 leading-token-tight">Returns and support</h3>
            <p>
            Return and refund eligibility is handled separately from shipping.
            Please review the returns guidance and refund policy before
            purchase.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ButtonLink
            href={storefrontTrust.policyRoutes.refundPolicy}
            variant="outline"
            size="md"
          >
            Refund Policy
          </ButtonLink>
            <ButtonLink href={storefrontTrust.policyRoutes.track} variant="outline" size="md">
              Track Order
            </ButtonLink>
          </div>
        </SectionBlock>
      </ContentContainer>
    </>
  );
}

