import type { Metadata } from 'next';

import { StaticPolicyPage } from '@/components/policies/StaticPolicyPage';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Privacy Policy | Odhvica - How We Use Your Data',
  description:
    "Odhvica's Privacy Policy explains what data we collect, how we use it, who we share it with, and your rights.",
  path: '/pages/privacy-policy',
  keywords: ['Odhvica privacy policy', 'Odhvica data policy', 'Odhvica privacy'],
});

const content = `## Privacy Policy

Effective Date: 15 May 2026

Your privacy matters to us. This policy explains what personal data we collect, why we collect it, and how we protect it. We are based in India and sell to customers across the world, so this policy reflects applicable Indian law and international privacy best practices.

---

### 1. Who We Are

Odhvica operates from Jaipur, Rajasthan, India.  
Email: support@odhvica.com  
Address: 44C, Vijaypura, Sumel, Jaipur, Rajasthan 302031, India

---

### 2. What Data We Collect

When you browse or buy from odhvica.com, we may collect:

- **Contact information:** name, email address, phone number
- **Delivery information:** shipping address, pincode, country
- **Payment information:** we do not store card details; payments are processed by our payment partners
- **Order information:** products purchased, order value, order history
- **Device and browsing data:** IP address, browser type, pages visited, time on site
- **Communications:** messages you send us via email or WhatsApp

We do not knowingly collect data from anyone under the age of 18.

---

### 3. Why We Use Your Data

| Purpose | Legal Basis |
| --- | --- |
| Processing and fulfilling your order | Contractual necessity |
| Sending order confirmation and shipping updates | Contractual necessity |
| Responding to support queries | Contractual necessity / Legitimate interest |
| Sending marketing emails (with your consent) | Consent |
| Improving website performance and user experience | Legitimate interest |
| Complying with legal and accounting obligations | Legal obligation |

---

### 4. Who We Share Your Data With

We share your data only where necessary:

- **Shipping partners:** FedEx, DHL, Aramex, India Post, Delhivery, and similar delivery providers
- **Payment gateway partners:** Razorpay for India payments and PayPal for international payments
- **Email service provider:** to send you order and marketing emails
- **Website analytics providers:** anonymised browsing data to help us understand site performance

We do not sell your personal data to any third party.

---

### 5. Cookies

We use cookies to keep your cart active, remember your preferences, and understand how visitors use the site. You can control cookie settings in your browser.

---

### 6. How We Protect Your Data

We use HTTPS encryption on all pages. Payment data is processed by PCI-DSS compliant gateway partners and is not stored on our servers. Access to customer data is restricted to necessary team members only.

---

### 7. How Long We Keep Your Data

Order and transaction data is retained for the period required for tax, accounting, and dispute-resolution purposes. Account and communication data is retained for as long as your account is active or as needed to resolve disputes. Marketing consent records are retained until you withdraw consent.

---

### 8. Your Rights

Depending on where you live, you may have the right to:

- Access the personal data we hold about you
- Request correction of inaccurate data
- Request deletion of your data, subject to legal retention obligations
- Withdraw marketing consent at any time
- Request additional information about how your data is used

To exercise any of these rights, email support@odhvica.com with **Privacy Request** in the subject line.

---

### 9. International Transfers

If you are outside India, your data may be transferred to and processed in India. We take reasonable steps to ensure your data is protected in accordance with this policy.

---

### 10. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be published on this page with a revised effective date.`;

export default function PrivacyPolicyPage() {
  return (
    <StaticPolicyPage
      title="Privacy Policy"
      path="/pages/privacy-policy"
      description="Read how Odhvica collects, uses, shares, and protects customer data."
      content={content}
    />
  );
}
