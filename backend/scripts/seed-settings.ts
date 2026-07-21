import { db } from '../src/db/client';
import { settings } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const DEFAULT_SETTINGS = [
  // General store info
  { key: 'store_name',                  value: 'Odhvica',                          category: 'general' },
  { key: 'store_email',                 value: 'support@odhvica.com',              category: 'general' },
  { key: 'store_phone',                 value: '+91 98765 43210',                   category: 'general' },
  { key: 'store_address',               value: 'Jaipur, Rajasthan, India',          category: 'general' },
  { key: 'store_currency',              value: 'INR',                               category: 'general' },
  { key: 'store_country',               value: 'IN',                                category: 'general' },

  // Tax
  { key: 'tax_rate',                    value: 18,                                  category: 'tax' },
  { key: 'tax_inclusive',               value: false,                               category: 'tax' },
  { key: 'tax_name',                    value: 'GST',                               category: 'tax' },

  // Shipping
  { key: 'domestic_shipping_rate',      value: 99,                                  category: 'shipping' },
  { key: 'international_shipping_rate', value: 499,                                 category: 'shipping' },
  { key: 'free_shipping_threshold',     value: 999,                                 category: 'shipping' },
  { key: 'free_shipping_enabled',       value: true,                                category: 'shipping' },
  { key: 'shipping_countries',          value: 'IN,US,CA,GB,AU,AE,SG,MY,NZ,JP',   category: 'shipping' },

  // Homepage content
  { key: 'announcement_bar_text',       value: 'Free shipping on orders above ₹999 | Use code WELCOME10 for 10% off', category: 'content' },
  { key: 'announcement_bar_enabled',    value: true,                                category: 'content' },
  { key: 'hero_title',                  value: 'Handcrafted Indian Fashion',        category: 'content' },
  { key: 'hero_subtitle',               value: 'Discover the art of traditional Indian textiles', category: 'content' },
  { key: 'newsletter_title',            value: 'Join the Odhvica Family',          category: 'content' },
  { key: 'newsletter_subtitle',         value: 'Subscribe for exclusive deals and new arrivals', category: 'content' },

  // SEO defaults
  { key: 'seo_title',                   value: 'Odhvica — Handcrafted Indian Fashion', category: 'seo' },
  { key: 'seo_description',             value: 'Shop authentic handcrafted Indian clothing, sarees, dupattas and accessories at Odhvica.', category: 'seo' },

  // Social links
  { key: 'social_instagram',            value: 'https://instagram.com/odhvica',    category: 'social' },
  { key: 'social_facebook',             value: '',                                  category: 'social' },
  { key: 'social_twitter',              value: '',                                  category: 'social' },
  { key: 'social_youtube',              value: '',                                  category: 'social' },
  { key: 'social_pinterest',            value: '',                                  category: 'social' },

  // Order settings
  { key: 'order_prefix',               value: 'KV',                                category: 'orders' },
  { key: 'min_order_value',            value: 0,                                   category: 'orders' },
  { key: 'max_items_per_order',        value: 50,                                  category: 'orders' },

  // Email notifications
  { key: 'email_order_confirmation',   value: true,                                category: 'email' },
  { key: 'email_shipping_update',      value: true,                                category: 'email' },
  { key: 'email_low_stock_threshold',  value: 5,                                   category: 'email' },
];

async function seedSettings() {
  console.log('⚙️  Seeding store settings...');
  let created = 0;
  let skipped = 0;

  for (const setting of DEFAULT_SETTINGS) {
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, setting.key))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Skipped: ${setting.key} — already exists`);
      skipped++;
    } else {
      await db.insert(settings).values({
        key: setting.key,
        value: setting.value,
        category: setting.category,
      });
      console.log(`✅ ${setting.key}`);
      created++;
    }
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
}

seedSettings().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
