
import { Heading } from '@/design-system';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | Odhvica - Domestic & International Delivery',
  description:
    'Read Odhvica shipping charges, dispatch timelines, delivery estimates, tracking process, and customs guidance before placing an order.',
};

const domesticShipping = [
  ['Above Rs. 2,000', 'Free standard shipping'],
  ['Rs. 2,000 or below', 'Rs. 99 standard shipping'],
];

const domesticDelivery = [
  ['Metro cities', '3-5 business days'],
  ['Tier 2 and Tier 3 cities', '5-8 business days'],
  ['Remote or hilly areas', '7-12 business days'],
];

const internationalDelivery = [
  ['USA, UK, Australia', '8-14 business days'],
  ['Europe', '10-16 business days'],
  ['UAE and Gulf countries', '7-12 business days'],
  ['Rest of world', '12-20 business days'],
];

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border-subtle py-8">
      <h2 className="text-display-sm font-display font-[var(--ds-type-heading-weight)] text-primary">{title}</h2>
      <div className="mt-4 space-y-4 text-body-md leading-[var(--ds-leading-relaxed)] text-secondary">
        {children}
      </div>
    </section>
  );
}

function PolicyTable({
  rows,
  firstHeader,
  secondHeader,
}: {
  rows: string[][];
  firstHeader: string;
  secondHeader: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle">
      <table className="min-w-full divide-y divide-[var(--ds-border-subtle)] text-left text-body-sm">
        <thead className="bg-surface-soft text-secondary">
          <tr>
            <th className="px-4 py-3 font-[var(--ds-type-heading-weight)]">{firstHeader}</th>
            <th className="px-4 py-3 font-[var(--ds-type-heading-weight)]">{secondHeader}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--ds-border-subtle)] bg-surface-paper">
          {rows.map(([first, second]) => (
            <tr key={first}>
              <td className="px-4 py-3 text-primary">{first}</td>
              <td className="px-4 py-3 text-secondary">{second}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ShippingPolicyPage() {
  return (
    <main className="bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-body-xs font-ui uppercase tracking-[var(--ds-type-label-tracking)] text-muted">
          Policies
        </p>
        <Heading role="page" className="mt-3 text-display-md font-display font-[var(--ds-type-heading-weight)] text-primary">
          Shipping Policy
        </Heading>
        <p className="mt-4 text-body-lg leading-[var(--ds-leading-relaxed)] text-secondary">
          This Shipping Policy explains how Odhvica dispatches domestic and
          international orders placed on odhvica.com.
        </p>
        <p className="mt-3 text-body-sm text-muted">Effective Date: 7 June 2026</p>

        <PolicySection title="1. Dispatch Location">
          <p>
            Orders are packed and shipped from our workshop in Jaipur,
            Rajasthan, India.
          </p>
          <address className="not-italic">
            Business address: 44C, Vijaypura, Sumel, Jaipur, Rajasthan 302031,
            India
            <br />
            Support email: support@odhvica.com
            <br />
            WhatsApp: +91-9588078064
          </address>
        </PolicySection>

        <PolicySection title="2. Order Processing Time">
          <p>
            Processing time is the time between order confirmation and courier
            handover.
          </p>
          <PolicyTable
            firstHeader="Order Type"
            secondHeader="Processing Time"
            rows={[
              ['Domestic ready-to-ship orders', '2-4 business days'],
              ['International ready-to-ship orders', '3-5 business days'],
              ['Custom or personalised orders', '5-8 business days'],
            ]}
          />
          <p>
            Orders are not processed or dispatched on Sundays and public
            holidays.
          </p>
        </PolicySection>

        <PolicySection title="3. Domestic Shipping Within India">
          <PolicyTable
            firstHeader="Order Value"
            secondHeader="Shipping Charge"
            rows={domesticShipping}
          />
          <p>Estimated delivery after dispatch:</p>
          <PolicyTable
            firstHeader="Destination"
            secondHeader="Estimated Delivery"
            rows={domesticDelivery}
          />
        </PolicySection>

        <PolicySection title="4. International Shipping">
          <p>
            International shipping is calculated at checkout based on
            destination and package weight. We currently ship to the USA, UK,
            European Union, Australia, Canada, UAE, and many other destinations
            where courier service is available.
          </p>
          <p>
            International shipments are handled through courier partners such as
            FedEx, DHL, and Aramex depending on destination and serviceability.
          </p>
          <PolicyTable
            firstHeader="Destination"
            secondHeader="Estimated Delivery"
            rows={internationalDelivery}
          />
          <p>
            These timelines are estimates. Customs checks, carrier delays,
            festivals, weather, and public holidays can extend delivery time.
          </p>
        </PolicySection>

        <PolicySection title="5. Tracking">
          <p>
            Once your order is dispatched, we send a shipping confirmation email
            with tracking details. You can also track your order at
            odhvica.com/track using your order reference and purchase email.
          </p>
        </PolicySection>

        <PolicySection title="6. Customs, Duties, and Import Taxes">
          <p>
            For international orders, customs duties, import taxes, brokerage
            charges, or local fees may be charged by the destination country.
            These charges are the buyer&apos;s responsibility and are not
            included in the product price or shipping charge unless explicitly
            stated at checkout.
          </p>
          <p>
            Odhvica declares shipment values accurately and does not mark
            commercial parcels as gifts.
          </p>
        </PolicySection>

        <PolicySection title="7. Delayed, Lost, or Damaged Shipments">
          <p>
            If your parcel is delayed, contact us with your order number and
            tracking details. If tracking shows delivered but you have not
            received the parcel, please first check with neighbours, reception,
            building security, or the courier partner, then contact us for help.
          </p>
          <p>
            If your package arrives visibly damaged, photograph the outer
            packaging before opening and notify us within 48 hours.
          </p>
        </PolicySection>

        <PolicySection title="8. Non-Serviceable Locations">
          <p>
            If your delivery address is not serviceable by our courier partners,
            we may contact you for an alternate address or cancel the order with
            a full refund.
          </p>
        </PolicySection>

        <PolicySection title="9. Support">
          <p>
            Email: support@odhvica.com
            <br />
            WhatsApp: +91-9588078064
            <br />
            Support hours: Monday-Friday, 9 AM - 6 PM IST
          </p>
        </PolicySection>
      </div>
    </main>
  );
}
