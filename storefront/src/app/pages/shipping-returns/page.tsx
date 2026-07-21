import type { Metadata } from 'next';

import { StaticPolicyPage } from '@/components/policies/StaticPolicyPage';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Shipping & Returns Policy | Odhvica - Handmade India',
  description:
    'Odhvica ships across India and internationally. Read our shipping timelines, return eligibility, refund process, and exchange rules before you buy.',
  path: '/pages/shipping-returns',
  keywords: ['Odhvica shipping policy', 'Odhvica returns', 'Odhvica refund policy'],
});

const content = `## Shipping & Returns

Effective Date: 15 May 2026

---

### Where We Ship

We ship from our workshop in Jaipur, Rajasthan. Domestic orders go across India. International orders ship to the USA, UK, European Union, Australia, Canada, UAE, and many other destinations. If your country is not showing at checkout, write to us and we will check availability.

---

### Processing Time

Processing is the time between when you place your order and when we hand it to a courier. Because most of our pieces are handmade or made in small batches, please allow:

- Domestic orders: **2-4 business days**
- International orders: **3-5 business days**
- Custom or personalised orders: **5-8 business days**

We do not process or dispatch orders on Sundays and public holidays.

---

### Delivery Timelines (after dispatch)

| Destination | Estimated Delivery |
| --- | --- |
| India - Metro cities | 3-5 business days |
| India - Tier 2 / 3 cities | 5-8 business days |
| India - Remote / hilly areas | 7-12 business days |
| USA, UK, Australia | 8-14 business days |
| Europe | 10-16 business days |
| UAE, Gulf | 7-12 business days |
| Rest of world | 12-20 business days |

These are estimates, not guarantees. Festive seasons, national holidays, customs checks, and carrier delays can extend timelines.

---

### Shipping Charges

- India: Free on orders above **₹2,000**. Flat **₹99** below ₹2,000.
- International: Calculated at checkout based on destination and package weight.

International shipments are handled by **FedEx, DHL, and Aramex** depending on destination and service availability.

---

### Tracking Your Order

Once your order is dispatched, you will receive a shipping confirmation email with a tracking link. You can also track your order at odhvica.com/track using your order number and email address.

---

### Customs, Duties, and Import Taxes

International buyers are responsible for any customs duties, import taxes, or brokerage fees charged by their country's customs authority. These charges are not collected by Odhvica and are not included in your order total or shipping fee.

We declare shipment values accurately and do not mark parcels as gifts.

---

### Our Return Policy

We stand behind every piece we make. If something goes wrong, we want to make it right.

**You can return an item if**

- It arrived with a genuine manufacturing defect
- The item delivered is materially different from what was shown or described
- The wrong item was sent to you

**You cannot return an item if**

- The return request is made more than 15 days after delivery
- The item has been worn, washed, dry-cleaned, or altered
- You purchased a custom or personalised item and it was made as specified
- The return is based on a change of mind or a size issue that could have been checked before ordering

**International returns**

Due to customs complexities, international orders are eligible for **exchange or store credit only**, subject to stock availability.

---

### How to Start a Return

1. Email support@odhvica.com within 15 days of delivery.
2. Use the subject line: **Return Request - Order #[your order number]**
3. Attach 2-3 clear photos of the item showing the issue.
4. We will review your request and respond with next steps.
5. If approved, we will send you the return address and packaging instructions.

Please do not return items without receiving approval first.

---

### Return Shipping

- If the return is due to our error, we cover return shipping.
- All other approved returns are shipped back at the buyer's cost.

We recommend using a tracked courier for returns.

---

### Refunds

Once we receive and inspect the returned item, we will process your refund within **5-7 business days**. Refunds are issued to the original payment method.

- UPI / bank transfers: 3-5 additional business days depending on your bank
- Credit / debit card: 5-7 business days
- International card: 7-10 business days

You will receive an email confirmation once your refund is initiated.

---

### Exchanges

If you would like a different size, colour, or product, email support@odhvica.com. We will confirm availability before you return your item. Exchanges are processed once the original item is received and inspected.

---

### Lost or Damaged Shipments

If your parcel shows as delivered but you have not received it, first check with neighbours or building security, then contact the courier with your tracking number. Write to us as well and we will help you investigate.

If your item arrives visibly damaged, photograph the packaging before opening and notify us within 48 hours.

---

### Support

Email: support@odhvica.com  
WhatsApp: +91-9588078064  
Hours: Monday-Friday, 9 AM - 6 PM IST  
Cancellation window: Same business day, before dispatch.`;

export default function ShippingReturnsPage() {
  return (
    <StaticPolicyPage
      title="Shipping & Returns"
      path="/pages/shipping-returns"
      description="Read Odhvica shipping timelines, return eligibility, refund handling, and exchange rules."
      content={content}
    />
  );
}
