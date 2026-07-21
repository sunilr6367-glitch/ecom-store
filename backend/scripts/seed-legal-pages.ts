/**
 * FIX-008: Seed Legal Pages
 * Privacy Policy, Terms of Service, Refund Policy
 */

import "dotenv/config";
import { db } from "../src/db";
import { pages } from "../src/db/schema";
import { eq } from "drizzle-orm";

const legalPages = [
    {
        title: "Privacy Policy",
        slug: "privacy-policy",
        content: `
<h1>Privacy Policy</h1>
<p>Last updated: ${new Date().toISOString().split('T')[0]}</p>

<h2>1. Introduction</h2>
<p>Welcome to Odhvica. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data and tell you about your privacy rights.</p>

<h2>2. Data We Collect</h2>
<p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
<ul>
  <li><strong>Identity Data:</strong> Includes first name, last name, username or similar identifier.</li>
  <li><strong>Contact Data:</strong> Includes billing address, delivery address, email address and telephone numbers.</li>
  <li><strong>Financial Data:</strong> Includes payment card details (processed securely by Stripe).</li>
  <li><strong>Transaction Data:</strong> Includes details about payments to and from you.</li>
  <li><strong>Technical Data:</strong> Includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
</ul>

<h2>3. How We Use Your Data</h2>
<p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
<ul>
  <li>To register you as a new customer</li>
  <li>To process and deliver your order</li>
  <li>To manage our relationship with you</li>
  <li>To use data analytics to improve our website, products/services, marketing, customer relationships, and experiences</li>
</ul>

<h2>4. Data Security</h2>
<p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.</p>

<h2>5. Your Legal Rights</h2>
<p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
<ul>
  <li>Request access to your personal data</li>
  <li>Request correction of your personal data</li>
  <li>Request erasure of your personal data</li>
  <li>Object to processing of your personal data</li>
  <li>Request restriction of processing your personal data</li>
  <li>Request transfer of your personal data</li>
  <li>Withdraw consent</li>
</ul>

<h2>6. Contact Us</h2>
<p>If you have any questions about this privacy policy or our privacy practices, please contact us at support@odhvica.com</p>
`,
        is_visible: true,
        seo_title: "Privacy Policy - Odhvica",
        seo_description: "Learn how Odhvica protects your privacy and handles your personal data.",
    },
    {
        title: "Terms of Service",
        slug: "terms-of-service",
        content: `
<h1>Terms of Service</h1>
<p>Last updated: ${new Date().toISOString().split('T')[0]}</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using Odhvica's website and services, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Use of Services</h2>
<p>You agree to use our services only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.</p>

<h2>3. Account Registration</h2>
<p>When you create an account with us, you must provide us with accurate and complete information. You are responsible for safeguarding your account credentials.</p>

<h2>4. Orders and Payments</h2>
<ul>
  <li>All orders are subject to availability and confirmation of the order price</li>
  <li>We reserve the right to refuse or cancel any order for any reason</li>
  <li>Payment must be made at the time of order placement</li>
  <li>All prices are in Indian Rupees (INR) unless otherwise stated</li>
</ul>

<h2>5. Intellectual Property</h2>
<p>All content included on this website, such as text, graphics, logos, button icons, images, audio clips, and software, is the property of Odhvica or its content suppliers.</p>

<h2>6. Limitation of Liability</h2>
<p>Odhvica shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.</p>

<h2>7. Changes to Terms</h2>
<p>We reserve the right to modify or replace these Terms at any time. Your continued use of the service after any changes constitutes acceptance of the new Terms.</p>

<h2>8. Governing Law</h2>
<p>These Terms shall be governed by and construed in accordance with the laws of India.</p>

<h2>9. Contact Information</h2>
<p>If you have any questions about these Terms, please contact us at support@odhvica.com</p>
`,
        is_visible: true,
        seo_title: "Terms of Service - Odhvica",
        seo_description: "Terms and conditions governing the use of Odhvica's website and services.",
    },
    {
        title: "Refund and Cancellation Policy",
        slug: "refund-policy",
        content: `
<h1>Refund and Cancellation Policy</h1>
<p>Last updated: ${new Date().toISOString().split('T')[0]}</p>

<h2>1. Cancellation Policy</h2>
<p>You can cancel your order before it is shipped. Once an order is shipped, it cannot be cancelled.</p>
<ul>
  <li><strong>Before Shipping:</strong> Full refund will be processed within 5-7 business days</li>
  <li><strong>After Shipping:</strong> Cancellation not possible; please refer to Returns section</li>
</ul>

<h2>2. Return Policy</h2>
<p>We offer a 7-day return policy for eligible items. To be eligible for a return:</p>
<ul>
  <li>Item must be unused and in the same condition as received</li>
  <li>Item must be in original packaging</li>
  <li>Proof of purchase (order receipt or confirmation email) is required</li>
</ul>

<h2>3. Non-Returnable Items</h2>
<p>The following items cannot be returned:</p>
<ul>
  <li>Customized or personalized items</li>
  <li>Perishable goods</li>
  <li>Intimate apparel and swimwear</li>
  <li>Sale items</li>
</ul>

<h2>4. Refund Process</h2>
<ol>
  <li>Contact us within 7 days of receiving the item</li>
  <li>Our team will review your return request</li>
  <li>If approved, we will provide a return shipping label</li>
  <li>Once we receive and inspect the item, refund will be processed</li>
  <li>Refund will be credited to original payment method within 5-7 business days</li>
</ol>

<h2>5. Exchanges</h2>
<p>We only replace items if they are defective or damaged. If you need to exchange for the same item, contact us at support@odhvica.com</p>

<h2>6. Late or Missing Refunds</h2>
<p>If you haven't received your refund within the stated timeframe:</p>
<ul>
  <li>Check your bank account again</li>
  <li>Contact your credit card company (may take time to post)</li>
  <li>Contact your bank (processing time before posting)</li>
  <li>If still not resolved, contact us</li>
</ul>

<h2>7. Shipping Costs</h2>
<ul>
  <li>Return shipping is free for defective or incorrect items</li>
  <li>Customer is responsible for return shipping for size/colour changes</li>
</ul>

<h2>8. Contact Us</h2>
<p>For any questions about our Refund and Cancellation Policy, please contact us at support@odhvica.com</p>
`,
        is_visible: true,
        seo_title: "Refund and Cancellation Policy - Odhvica",
        seo_description: "Learn about our refund, cancellation, and return policies.",
    },
    {
        title: "Shipping Policy",
        slug: "shipping-policy",
        content: `
<h1>Shipping Policy</h1>
<p>Last updated: ${new Date().toISOString().split('T')[0]}</p>

<h2>1. Shipping Destinations</h2>
<p>We currently ship to all locations within India. International shipping is not available at this time.</p>

<h2>2. Shipping Partners</h2>
<p>We partner with reliable courier services including Delhivery, DTDC, and India Post to ensure safe delivery of your orders.</p>

<h2>3. Processing Time</h2>
<ul>
  <li><strong>Order Processing:</strong> 1-2 business days</li>
  <li><strong>Order Placement:</strong> Orders placed before 2 PM IST are processed the same day</li>
  <li><strong>Custom Orders:</strong> May take 5-7 business days</li>
</ul>

<h2>4. Delivery Timeframes</h2>
<ul>
  <li><strong>Metro Cities:</strong> 3-5 business days</li>
  <li><strong>Other Cities:</strong> 5-7 business days</li>
  <li><strong>Remote Areas:</strong> 7-10 business days</li>
</ul>

<h2>5. Shipping Charges</h2>
<ul>
  <li><strong>Orders above ₹500:</strong> Free shipping</li>
  <li><strong>Orders below ₹500:</strong> ₹49 shipping charge</li>
  <li><strong>Express Delivery:</strong> ₹99 (2-3 business days)</li>
</ul>

<h2>6. Order Tracking</h2>
<p>Once your order is shipped, you will receive a tracking number via SMS and email. You can track your order on the courier partner's website.</p>

<h2>7. Delivery Issues</h2>
<p>If your package is lost, damaged, or not delivered:</p>
<ul>
  <li>Contact us immediately with your order number</li>
  <li>We will initiate an investigation with the courier</li>
  <li>Damaged items will be replaced or refunded</li>
</ul>

<h2>8. Undeliverable Packages</h2>
<p>If a package is returned to us due to incorrect address or non-availability:</p>
<ul>
  <li>We will contact you to confirm the correct address</li>
  <li>Reshipping charges will apply</li>
  <li>Unclaimed packages after 30 days will be refunded (minus shipping charges)</li>
</ul>

<h2>9. Contact Us</h2>
<p>For shipping inquiries, please contact us at support@odhvica.com</p>
`,
        is_visible: true,
        seo_title: "Shipping Policy - Odhvica",
        seo_description: "Learn about our shipping rates, delivery times, and policies.",
    },
];

async function seedLegalPages() {
    console.log("🌱 Seeding legal pages...\n");

    for (const page of legalPages) {
        try {
            // Check if page already exists
            const [existing] = await db
                .select()
                .from(pages)
                .where(eq(pages.slug, page.slug))
                .limit(1);

            if (existing) {
                // Update existing page
                await db
                    .update(pages)
                    .set({
                        title: page.title,
                        content: page.content,
                        is_visible: page.is_visible,
                        seo_title: page.seo_title,
                        seo_description: page.seo_description,
                        updated_at: new Date(),
                    })
                    .where(eq(pages.id, existing.id));
                console.log(`✅ Updated: ${page.title} (${page.slug})`);
            } else {
                // Insert new page
                await db.insert(pages).values(page);
                console.log(`✅ Created: ${page.title} (${page.slug})`);
            }
        } catch (error) {
            console.error(`❌ Error with ${page.slug}:`, error);
        }
    }

    console.log("\n✨ Legal pages seeding complete!");
}

seedLegalPages()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
