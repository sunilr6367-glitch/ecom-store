
import { db } from "../src/db";
import { pages } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const standardPages = [
    {
        title: "Contact Us",
        slug: "contact",
        content: `
<h1>Contact Odhvica</h1>
<p>We'd love to hear from you. For inquiries about our products, orders, or wholesale opportunities, please reach out.</p>
<ul>
    <li>Email: support@odhvica.com</li>
    <li>Phone: +91 98765 43210</li>
    <li>Address: 123 Artisan Lane, Jaipur, Rajasthan, India</li>
</ul>
        `,
        is_visible: true,
        seo_title: "Contact Odhvica | Customer Support",
        seo_description: "Contact Odhvica for any queries regarding our artisanal products."
    },
    {
        title: "Shipping & Returns",
        slug: "shipping-returns",
        content: `
<h1>Shipping & Returns</h1>
<h2>Shipping Policy</h2>
<p>We ship worldwide. Orders are processed within 2-3 business days.</p>
<ul>
    <li>Domestic (India): 3-5 business days</li>
    <li>International: 7-14 business days</li>
</ul>
<h2>Return Policy</h2>
<p>We accept returns within 14 days of delivery for unworn, unwashed items with tags attached.</p>
        `,
        is_visible: true
    },
    {
        title: "Frequently Asked Questions",
        slug: "faq",
        content: `
<h1>FAQ</h1>
<h3>Where are your products made?</h3>
<p>All our products are handcrafted by skilled artisans in India.</p>
<h3>Do you offer customization?</h3>
<p>Yes, for bulk orders we offer customization. Please visit our Wholesale page.</p>
        `,
        is_visible: true
    },
    {
        title: "Privacy Policy",
        slug: "privacy-policy",
        content: `<h1>Privacy Policy</h1><p>Your privacy is important to us. We store data securely...</p>`,
        is_visible: true
    },
    {
        title: "Terms of Service",
        slug: "terms-of-service",
        content: `<h1>Terms of Service</h1><p>By using our website, you agree to these terms...</p>`,
        is_visible: true
    }
];

async function seed() {
    console.log("🌱 Seeding Pages...");

    for (const p of standardPages) {
        const existing = await db.select().from(pages).where(eq(pages.slug, p.slug));
        if (existing.length === 0) {
            await db.insert(pages).values({
                id: randomUUID(),
                ...p,
                created_at: new Date(),
                updated_at: new Date()
            });
            console.log(`✅ Created: ${p.title}`);
        } else {
            console.log(`⏭️ Skipped: ${p.title} (Already exists)`);
        }
    }
    console.log("✨ Pages Seeding Complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding Failed:", err);
    process.exit(1);
});
