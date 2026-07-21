import type { Metadata } from 'next';

import { StaticPolicyPage } from '@/components/policies/StaticPolicyPage';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Terms of Service | Odhvica Handmade - India',
  description:
    "Read Odhvica's Terms of Service. Covers orders, payments, shipping, returns, intellectual property and your rights as a buyer in India and internationally.",
  path: '/pages/terms-of-service',
  keywords: ['Odhvica terms of service', 'Odhvica terms', 'Odhvica payments'],
});

const content = `## Terms of Service

Effective Date: 15 May 2026

These Terms of Service ("Terms") govern your use of odhvica.com and any purchase you make from Odhvica. By placing an order or browsing this website, you agree to these Terms in full. If you do not agree, please do not use this website.

---

### 1. About Us

Odhvica is a handmade textile and clothing brand based in Jaipur, Rajasthan, India. We design and produce kantha quilts, block-print clothing, artisan bags, and related goods, most of which are made to order or in small batches by skilled artisans.

Business correspondence address: 44C, Vijaypura, Sumel, Jaipur, Rajasthan 302031, India  
GST Registration No.: Not applicable — small business, not GST registered  
Email: support@odhvica.com  
Support hours: Monday-Friday, 9 AM - 6 PM IST

---

### 2. Orders and Contract

When you place an order on odhvica.com, you are making an offer to purchase. Your order is confirmed only when you receive a confirmation email from us. We reserve the right to decline or cancel an order at any time before dispatch — for example, if a product is found to be out of stock, there is a pricing error, or we are unable to verify payment. In such cases, any amount charged will be refunded in full.

All prices are listed in Indian Rupees (₹) by default. International buyers may see approximate converted prices; the final charge depends on your payment provider's exchange rate at the time of settlement.

---

### 3. Handmade Nature of Products

Every item sold on Odhvica is handmade or hand-finished. This means:

- Slight variations in colour, print placement, stitch density, and size can exist between pieces and between product photos and actual items.
- These variations are not defects. They are the natural result of handcraft and are part of what makes each piece unique.
- Exact colour matching cannot be guaranteed due to screen calibration differences.

If your item arrives with a genuine manufacturing defect — such as a broken seam, a missing component, or a printing error that materially affects use — please contact us within 7 days of delivery with photographs and we will review the issue.

---

### 4. Pricing and Payment

Prices shown on the website are inclusive of applicable taxes where stated. We accept the following payment methods:

**For buyers in India**

- UPI
- Credit and debit cards: Visa, Mastercard, RuPay, and Amex
- Net Banking
- Wallets

All INR payments are processed via Razorpay.

**For international buyers**

- PayPal for international buyers only
- Supported PayPal funding sources: Visa, Mastercard, Amex, and PayPal balance

If your payment fails, your order will not be processed. Please retry only after confirming that you were not charged, or contact support for help. We do not store card details on our servers.

---

### 5. Cancellations

You may cancel an order on the same business day, before dispatch. To request a cancellation, email support@odhvica.com with your order number in the subject line.

Once an order is dispatched, it cannot be cancelled. You may initiate a return after delivery if your order is eligible under our Shipping & Returns Policy.

Custom or personalised orders cannot be cancelled once production has begun.

---

### 6. Shipping

We ship from Jaipur, Rajasthan, India.

**Domestic (India)**

- Processing time: 2-4 business days
- Estimated delivery: 5-8 business days after dispatch
- Free shipping on orders above ₹2,000

**International**

- Processing time: 3-5 business days
- Estimated delivery: 8-18 business days after dispatch
- Shipping partners: FedEx, DHL, and Aramex

Remote or non-serviceable areas may take longer. Tracking information is shared once your order is dispatched. You can also track your order at odhvica.com/track.

---

### 7. Returns and Exchanges

We want you to love what you receive. If something is not right, here is how we handle it.

**Eligible for return**

- Items with a confirmed manufacturing defect
- Items significantly different from what was described or shown
- Wrong item delivered

**Not eligible for return**

- Items returned more than 15 days after delivery
- Items that have been worn, washed, dry-cleaned, or altered
- Custom or personalised orders
- Returns based on a change of mind or a size issue that could have been checked before ordering

**International orders**

International returns are handled as exchanges or store credit only, subject to stock availability.

**How to initiate**

Email support@odhvica.com within 15 days of delivery with your order number and clear photos of the issue. Once approved, we will share the return address and instructions. Please do not return items without receiving approval first.

**Refunds**

Approved refunds are processed within 5-7 business days after we receive the returned item and inspect it. Refunds are issued to the original payment method.

---

### 8. Intellectual Property

All content on odhvica.com — including product photographs, design artwork, brand name, logo, copy, and print patterns — is the property of Odhvica. You may not reproduce, copy, or distribute any content from this website without prior written permission. Sharing product links or images for personal, non-commercial reference is permitted.

---

### 9. Limitation of Liability

Odhvica's liability for any claim arising from a purchase is limited to the value of the order in question. We are not liable for losses caused by events outside our control, including carrier delays, customs clearance holds, force majeure events, or payment gateway failures.

---

### 10. Governing Law

These Terms are governed by the laws of India. Any dispute will be subject to the jurisdiction of courts in Jaipur, Rajasthan.

---

### 11. Changes to These Terms

We may update these Terms from time to time. The updated version will be published on this page with a revised effective date. Continued use of the website after changes constitutes acceptance.

---

**Questions?**  
Email support@odhvica.com`;

export default function TermsOfServicePage() {
  return (
    <StaticPolicyPage
      title="Terms of Service"
      path="/pages/terms-of-service"
      description="Read Odhvica's Terms of Service for orders, payments, shipping, returns, intellectual property, and buyer rights."
      content={content}
    />
  );
}
