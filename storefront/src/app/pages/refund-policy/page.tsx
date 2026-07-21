
import { Heading } from '@/design-system';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy | Odhvica',
  description:
    'Read Odhvica cancellation, return eligibility, refund timeline, non-returnable items, and refund method policy before buying.',
};

const refundTimelines = [
  ['UPI or bank-linked payment', '3-5 business days'],
  ['Credit or debit card', '5-7 business days'],
  ['International card or wallet', '7-10 business days'],
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
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

export default function RefundPolicyPage() {
  return (
    <main className="bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-body-xs font-ui uppercase tracking-[var(--ds-type-label-tracking)] text-muted">
          Policies
        </p>
        <Heading role="page" className="mt-3 text-display-md font-display font-[var(--ds-type-heading-weight)] text-primary">
          Cancellation & Refund Policy
        </Heading>
        <p className="mt-4 text-body-lg leading-[var(--ds-leading-relaxed)] text-secondary">
          This policy explains how cancellations, returns, exchanges, and
          refunds are handled for orders placed on odhvica.com.
        </p>
        <p className="mt-3 text-body-sm text-muted">Effective Date: 7 June 2026</p>

        <PolicySection title="1. Cancellation Before Dispatch">
          <p>
            You may request cancellation on the same business day, before the
            order is dispatched.
          </p>
          <p>To request cancellation, email support@odhvica.com with:</p>
          <BulletList
            items={['Order number', 'Purchase email', 'Reason for cancellation']}
          />
          <p>
            If the order has not been dispatched, we will cancel it and initiate
            a refund to the original payment method.
          </p>
        </PolicySection>

        <PolicySection title="2. When Cancellation Is Not Possible">
          <p>Cancellation may not be possible if:</p>
          <BulletList
            items={[
              'The order has already been dispatched',
              'The order is custom, personalised, or made to specification and production has started',
              'The product was purchased under a final-sale or non-cancellable campaign clearly marked on the product or checkout page',
            ]}
          />
          <p>
            If dispatch has already happened, you may request a return after
            delivery if your order qualifies under this policy.
          </p>
        </PolicySection>

        <PolicySection title="3. Return Eligibility">
          <p>You can request a return within 15 days of delivery if:</p>
          <BulletList
            items={[
              'The item arrived with a genuine manufacturing defect',
              'The wrong item was delivered',
              'The item is materially different from what was shown or described',
            ]}
          />
          <p>
            To qualify, the item must be unused, unwashed, unaltered, and
            returned with original packaging, tags, and invoice where applicable.
          </p>
        </PolicySection>

        <PolicySection title="4. Non-Returnable Items">
          <p>
            The following items are not eligible for return or refund unless
            damaged, defective, or wrongly delivered:
          </p>
          <BulletList
            items={[
              'Custom or personalised products',
              'Items that have been worn, washed, dry-cleaned, altered, or damaged after delivery',
              'Returns requested more than 15 days after delivery',
              'Products returned without approval from Odhvica support',
              'Change-of-mind returns',
              'Size issues that could have been checked against the size guide before ordering',
              'Gift cards or digital vouchers, if offered',
            ]}
          />
        </PolicySection>

        <PolicySection title="5. How To Start a Return">
          <p>
            Email support@odhvica.com within 15 days of delivery with your
            order number, purchase email, clear photos or video showing the
            issue, and a short description of the problem.
          </p>
          <p>
            Please do not ship any item back until our support team approves the
            return and shares return instructions.
          </p>
        </PolicySection>

        <PolicySection title="6. Return Shipping">
          <p>
            If the return is due to our error, such as a wrong item, defective
            item, or item materially different from the listing, Odhvica will
            cover reasonable return shipping.
          </p>
          <p>
            For any other approved return, the buyer is responsible for return
            shipping. We recommend using a tracked courier because Odhvica is
            not responsible for items lost in return transit.
          </p>
        </PolicySection>

        <PolicySection title="7. Inspection and Refund Timeline">
          <p>
            Once we receive the returned item, we inspect it for eligibility. If
            approved, refunds are initiated within 5-7 business days after
            inspection.
          </p>
          <p>Refunds are issued to the original payment method used at checkout.</p>
          <PolicyTable
            firstHeader="Payment Method"
            secondHeader="Estimated Time After Initiation"
            rows={refundTimelines}
          />
          <p>
            Actual settlement time depends on the bank, card network, wallet, or
            payment provider.
          </p>
        </PolicySection>

        <PolicySection title="8. Partial Refunds">
          <p>Partial refunds may apply if:</p>
          <BulletList
            items={[
              'Only part of an order is returned',
              'A promotional discount was applied',
              'Shipping, customs, or payment charges are non-refundable',
              'The returned item is approved but has missing packaging or accessories',
            ]}
          />
          <p>
            We will explain the refund calculation before completing the refund
            where applicable.
          </p>
        </PolicySection>

        <PolicySection title="9. Exchanges and Store Credit">
          <p>
            Domestic orders may be eligible for exchange if stock is available.
            International orders are normally eligible for exchange or store
            credit only, because cross-border returns involve customs and
            courier constraints.
          </p>
        </PolicySection>

        <PolicySection title="10. Failed or Duplicate Payments">
          <p>
            If you believe you were charged but did not receive an order
            confirmation, contact support before retrying payment. Share the
            payment method, timestamp, amount, and any payment reference shown by
            your bank or payment app.
          </p>
          <p>
            If a duplicate payment is confirmed, we will initiate a refund to
            the original payment method.
          </p>
        </PolicySection>

        <PolicySection title="11. Support">
          <p>
            Email: support@odhvica.com
            <br />
            WhatsApp: +91-9588078064
            <br />
            Support hours: Monday-Friday, 9 AM - 6 PM IST
            <br />
            Business address: 44C, Vijaypura, Sumel, Jaipur, Rajasthan 302031,
            India
          </p>
        </PolicySection>
      </div>
    </main>
  );
}
