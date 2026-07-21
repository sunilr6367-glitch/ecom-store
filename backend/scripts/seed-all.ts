/**
 * Master seed script — runs all seed scripts in dependency order.
 * Safe to run multiple times (all scripts are idempotent).
 *
 * Usage:
 *   npx tsx scripts/seed-all.ts
 *   (or inside Docker: docker compose exec backend npx tsx scripts/seed-all.ts)
 */

import { db } from '../src/db/client';
import { regions, tags, settings, categories, wholesale_tiers, pages } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

// ── 1. Regions (49 global) ─────────────────────────────────────────────────
const REGIONS = [
  { name: 'India',          currency_code: 'inr', tax_rate: '18', tax_code: 'GST'      },
  { name: 'United States',  currency_code: 'usd', tax_rate: '0',  tax_code: 'Sales Tax' },
  { name: 'Canada',         currency_code: 'cad', tax_rate: '13', tax_code: 'HST'      },
  { name: 'Mexico',         currency_code: 'mxn', tax_rate: '16', tax_code: 'IVA'      },
  { name: 'United Kingdom', currency_code: 'gbp', tax_rate: '20', tax_code: 'VAT'      },
  { name: 'European Union', currency_code: 'eur', tax_rate: '20', tax_code: 'VAT'      },
  { name: 'Switzerland',    currency_code: 'chf', tax_rate: '8',  tax_code: 'VAT'      },
  { name: 'Norway',         currency_code: 'nok', tax_rate: '25', tax_code: 'MVA'      },
  { name: 'Sweden',         currency_code: 'sek', tax_rate: '25', tax_code: 'Moms'     },
  { name: 'Denmark',        currency_code: 'dkk', tax_rate: '25', tax_code: 'Moms'     },
  { name: 'Poland',         currency_code: 'pln', tax_rate: '23', tax_code: 'VAT'      },
  { name: 'Czechia',        currency_code: 'czk', tax_rate: '21', tax_code: 'DPH'      },
  { name: 'Hungary',        currency_code: 'huf', tax_rate: '27', tax_code: 'ÁFA'      },
  { name: 'Romania',        currency_code: 'ron', tax_rate: '19', tax_code: 'TVA'      },
  { name: 'UAE',            currency_code: 'aed', tax_rate: '5',  tax_code: 'VAT'      },
  { name: 'Saudi Arabia',   currency_code: 'sar', tax_rate: '15', tax_code: 'VAT'      },
  { name: 'Kuwait',         currency_code: 'kwd', tax_rate: '0',  tax_code: 'N/A'      },
  { name: 'Qatar',          currency_code: 'qar', tax_rate: '0',  tax_code: 'N/A'      },
  { name: 'Bahrain',        currency_code: 'bhd', tax_rate: '10', tax_code: 'VAT'      },
  { name: 'Oman',           currency_code: 'omr', tax_rate: '5',  tax_code: 'VAT'      },
  { name: 'Israel',         currency_code: 'ils', tax_rate: '17', tax_code: 'VAT'      },
  { name: 'Turkey',         currency_code: 'try', tax_rate: '20', tax_code: 'KDV'      },
  { name: 'Australia',      currency_code: 'aud', tax_rate: '10', tax_code: 'GST'      },
  { name: 'New Zealand',    currency_code: 'nzd', tax_rate: '15', tax_code: 'GST'      },
  { name: 'Japan',          currency_code: 'jpy', tax_rate: '10', tax_code: 'JCT'      },
  { name: 'South Korea',    currency_code: 'krw', tax_rate: '10', tax_code: 'VAT'      },
  { name: 'Singapore',      currency_code: 'sgd', tax_rate: '9',  tax_code: 'GST'      },
  { name: 'Hong Kong',      currency_code: 'hkd', tax_rate: '0',  tax_code: 'N/A'      },
  { name: 'China',          currency_code: 'cny', tax_rate: '13', tax_code: 'VAT'      },
  { name: 'Taiwan',         currency_code: 'twd', tax_rate: '5',  tax_code: 'VAT'      },
  { name: 'Malaysia',       currency_code: 'myr', tax_rate: '6',  tax_code: 'SST'      },
  { name: 'Thailand',       currency_code: 'thb', tax_rate: '7',  tax_code: 'VAT'      },
  { name: 'Indonesia',      currency_code: 'idr', tax_rate: '11', tax_code: 'PPN'      },
  { name: 'Philippines',    currency_code: 'php', tax_rate: '12', tax_code: 'VAT'      },
  { name: 'Vietnam',        currency_code: 'vnd', tax_rate: '10', tax_code: 'VAT'      },
  { name: 'Bangladesh',     currency_code: 'bdt', tax_rate: '15', tax_code: 'VAT'      },
  { name: 'Pakistan',       currency_code: 'pkr', tax_rate: '17', tax_code: 'GST'      },
  { name: 'Sri Lanka',      currency_code: 'lkr', tax_rate: '15', tax_code: 'VAT'      },
  { name: 'Nepal',          currency_code: 'npr', tax_rate: '13', tax_code: 'VAT'      },
  { name: 'Brazil',         currency_code: 'brl', tax_rate: '17', tax_code: 'ICMS'     },
  { name: 'Argentina',      currency_code: 'ars', tax_rate: '21', tax_code: 'IVA'      },
  { name: 'Chile',          currency_code: 'clp', tax_rate: '19', tax_code: 'IVA'      },
  { name: 'Colombia',       currency_code: 'cop', tax_rate: '19', tax_code: 'IVA'      },
  { name: 'Peru',           currency_code: 'pen', tax_rate: '18', tax_code: 'IGV'      },
  { name: 'South Africa',   currency_code: 'zar', tax_rate: '15', tax_code: 'VAT'      },
  { name: 'Nigeria',        currency_code: 'ngn', tax_rate: '7',  tax_code: 'VAT'      },
  { name: 'Kenya',          currency_code: 'kes', tax_rate: '16', tax_code: 'VAT'      },
  { name: 'Egypt',          currency_code: 'egp', tax_rate: '14', tax_code: 'VAT'      },
  { name: 'Ghana',          currency_code: 'ghs', tax_rate: '15', tax_code: 'VAT'      },
];

// ── 2. Tags ────────────────────────────────────────────────────────────────
const TAGS = [
  { name: 'New Arrival',     slug: 'new-arrival'    },
  { name: 'Bestseller',      slug: 'bestseller'     },
  { name: 'Sale',            slug: 'sale'           },
  { name: 'Handmade',        slug: 'handmade'       },
  { name: 'Kantha',          slug: 'kantha'         },
  { name: 'Limited Edition', slug: 'limited-edition' },
  { name: 'Plus Size',       slug: 'plus-size'      },
  { name: 'Gifting',         slug: 'gifting'        },
  { name: 'Sustainable',     slug: 'sustainable'    },
];

// ── 3. Settings ────────────────────────────────────────────────────────────
const SETTINGS = [
  { key: 'store_name',                  value: 'Odhvica',                          category: 'general'  },
  { key: 'store_email',                 value: 'support@odhvica.com',              category: 'general'  },
  { key: 'store_phone',                 value: '+91 98765 43210',                   category: 'general'  },
  { key: 'store_address',               value: 'Jaipur, Rajasthan, India',          category: 'general'  },
  { key: 'store_currency',              value: 'INR',                               category: 'general'  },
  { key: 'store_country',               value: 'IN',                                category: 'general'  },
  { key: 'tax_rate',                    value: 18,                                  category: 'tax'      },
  { key: 'tax_inclusive',               value: false,                               category: 'tax'      },
  { key: 'tax_name',                    value: 'GST',                               category: 'tax'      },
  { key: 'domestic_shipping_rate',      value: 99,                                  category: 'shipping' },
  { key: 'international_shipping_rate', value: 499,                                 category: 'shipping' },
  { key: 'free_shipping_threshold',     value: 999,                                 category: 'shipping' },
  { key: 'free_shipping_enabled',       value: true,                                category: 'shipping' },
  { key: 'shipping_countries',          value: 'IN,US,CA,GB,AU,AE,SG,MY,NZ,JP',   category: 'shipping' },
  { key: 'announcement_bar_text',       value: 'Free shipping on orders above ₹999 | Use code WELCOME10 for 10% off', category: 'content' },
  { key: 'announcement_bar_enabled',    value: true,                                category: 'content'  },
  { key: 'hero_title',                  value: 'Handcrafted Indian Fashion',        category: 'content'  },
  { key: 'hero_subtitle',               value: 'Discover the art of traditional Indian textiles', category: 'content' },
  { key: 'newsletter_title',            value: 'Join the Odhvica Family',          category: 'content'  },
  { key: 'newsletter_subtitle',         value: 'Subscribe for exclusive deals and new arrivals', category: 'content' },
  { key: 'seo_title',                   value: 'Odhvica — Handcrafted Indian Fashion', category: 'seo'  },
  { key: 'seo_description',             value: 'Shop authentic handcrafted Indian clothing, sarees, dupattas and accessories at Odhvica.', category: 'seo' },
  { key: 'social_instagram',            value: 'https://instagram.com/odhvica',    category: 'social'   },
  { key: 'social_facebook',             value: '',                                  category: 'social'   },
  { key: 'social_twitter',              value: '',                                  category: 'social'   },
  { key: 'social_youtube',              value: '',                                  category: 'social'   },
  { key: 'order_prefix',               value: 'KV',                                category: 'orders'   },
  { key: 'email_order_confirmation',   value: true,                                category: 'email'    },
  { key: 'email_shipping_update',      value: true,                                category: 'email'    },
  { key: 'email_low_stock_threshold',  value: 5,                                   category: 'email'    },
];

// ── 4. Categories ──────────────────────────────────────────────────────────
const TOP_CATEGORIES = [
  { name: 'Sarees',           slug: 'sarees',           emoji: '🥻', display_order: 1 },
  { name: 'Suits & Kurtas',   slug: 'suits-kurtas',     emoji: '👗', display_order: 2 },
  { name: 'Lehengas',         slug: 'lehengas',         emoji: '✨', display_order: 3 },
  { name: 'Dupattas & Stoles',slug: 'dupattas-stoles',  emoji: '🧣', display_order: 4 },
  { name: 'Accessories',      slug: 'accessories',      emoji: '💍', display_order: 5 },
  { name: 'Handmade',         slug: 'handmade',         emoji: '🤲', display_order: 6 },
  { name: 'New Arrivals',     slug: 'new-arrivals',     emoji: '🆕', display_order: 7 },
  { name: 'Sale',             slug: 'sale',             emoji: '🏷️', display_order: 8 },
];

const SUB_CATEGORIES = [
  { name: 'Silk Sarees',     slug: 'silk-sarees',     emoji: '🥻', display_order: 1, parent_slug: 'sarees'       },
  { name: 'Cotton Sarees',   slug: 'cotton-sarees',   emoji: '🥻', display_order: 2, parent_slug: 'sarees'       },
  { name: 'Kantha Sarees',   slug: 'kantha-sarees',   emoji: '🥻', display_order: 3, parent_slug: 'sarees'       },
  { name: 'Georgette Sarees',slug: 'georgette-sarees',emoji: '🥻', display_order: 4, parent_slug: 'sarees'       },
  { name: 'Jewellery',       slug: 'jewellery',       emoji: '💎', display_order: 1, parent_slug: 'accessories'  },
  { name: 'Bags & Clutches', slug: 'bags-clutches',   emoji: '👜', display_order: 2, parent_slug: 'accessories'  },
];

// ── 5. Wholesale Tiers ─────────────────────────────────────────────────────
const WHOLESALE_TIERS = [
  { name: 'Starter',    slug: 'starter',    discount_percent: 20, min_order_value: 0,       min_order_quantity: 0,   default_moq: 10,  payment_terms: 'net_30', color: '#10B981', priority: 1, description: 'Perfect for new boutiques. 20% off retail price.'         },
  { name: 'Growth',     slug: 'growth',     discount_percent: 35, min_order_value: 1000000, min_order_quantity: 50,  default_moq: 25,  payment_terms: 'net_45', color: '#3B82F6', priority: 2, description: 'For established businesses. 35% off retail price.'          },
  { name: 'Enterprise', slug: 'enterprise', discount_percent: 50, min_order_value: 5000000, min_order_quantity: 200, default_moq: 50,  payment_terms: 'net_60', color: '#8B5CF6', priority: 3, description: 'For large distributors and chain stores. 50% off retail.' },
];

// ── 6. Pages ───────────────────────────────────────────────────────────────
const PAGES = [
  { title: 'Privacy Policy',                slug: 'privacy-policy',              is_visible: true },
  { title: 'Terms of Service',              slug: 'terms-of-service',            is_visible: true },
  { title: 'Refund & Cancellation Policy',  slug: 'refund-cancellation-policy',  is_visible: true },
  { title: 'Shipping Policy',               slug: 'shipping-policy',             is_visible: true },
  { title: 'Contact Us',                    slug: 'contact',                     is_visible: true },
  { title: 'FAQ',                           slug: 'faq',                         is_visible: true },
  { title: 'About Us',                      slug: 'about',                       is_visible: true },
  { title: 'Wholesale Program',             slug: 'wholesale',                   is_visible: true },
];

// ── Runner ─────────────────────────────────────────────────────────────────
async function seedAll() {
  console.log('\n🚀 Odhvica — Full Database Seed');
  console.log('='.repeat(50));

  // 1. Regions
  console.log('\n📍 [1/6] Regions...');
  let c = 0, s = 0;
  for (const r of REGIONS) {
    const ex = await db.select().from(regions).where(eq(regions.currency_code, r.currency_code)).limit(1);
    if (ex.length === 0) { await db.insert(regions).values(r); c++; } else s++;
  }
  console.log(`   ✅ Created: ${c}, Skipped: ${s}`);

  // 2. Tags
  console.log('\n🏷️  [2/6] Tags...');
  c = 0; s = 0;
  for (const t of TAGS) {
    const ex = await db.select().from(tags).where(eq(tags.slug, t.slug)).limit(1);
    if (ex.length === 0) { await db.insert(tags).values({ name: t.name, slug: t.slug }); c++; } else s++;
  }
  console.log(`   ✅ Created: ${c}, Skipped: ${s}`);

  // 3. Settings
  console.log('\n⚙️  [3/6] Settings...');
  c = 0; s = 0;
  for (const setting of SETTINGS) {
    const ex = await db.select().from(settings).where(eq(settings.key, setting.key)).limit(1);
    if (ex.length === 0) { await db.insert(settings).values({ key: setting.key, value: setting.value, category: setting.category }); c++; } else s++;
  }
  console.log(`   ✅ Created: ${c}, Skipped: ${s}`);

  // 4. Categories (top-level first, then sub)
  console.log('\n🗂️  [4/6] Categories...');
  c = 0; s = 0;
  for (const cat of TOP_CATEGORIES) {
    const ex = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
    if (ex.length === 0) {
      await db.insert(categories).values({ name: cat.name, slug: cat.slug, emoji: cat.emoji, display_order: cat.display_order, show_in_header: true, is_active: true });
      c++;
    } else s++;
  }
  for (const cat of SUB_CATEGORIES) {
    const ex = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
    if (ex.length > 0) { s++; continue; }
    const parent = await db.select().from(categories).where(eq(categories.slug, cat.parent_slug)).limit(1);
    if (parent.length === 0) continue;
    await db.insert(categories).values({ name: cat.name, slug: cat.slug, emoji: cat.emoji, display_order: cat.display_order, show_in_header: false, is_active: true, parent_id: parent[0].id });
    c++;
  }
  console.log(`   ✅ Created: ${c}, Skipped: ${s}`);

  // 5. Wholesale Tiers
  console.log('\n🏭 [5/6] Wholesale Tiers...');
  c = 0; s = 0;
  for (const tier of WHOLESALE_TIERS) {
    const ex = await db.select().from(wholesale_tiers).where(eq(wholesale_tiers.slug, tier.slug)).limit(1);
    if (ex.length === 0) { await db.insert(wholesale_tiers).values({ ...tier, active: true }); c++; } else s++;
  }
  console.log(`   ✅ Created: ${c}, Skipped: ${s}`);

  // 6. Pages (placeholder — admin fills content)
  console.log('\n📄 [6/6] Pages...');
  c = 0; s = 0;
  for (const page of PAGES) {
    const ex = await db.select().from(pages).where(eq(pages.slug, page.slug)).limit(1);
    if (ex.length === 0) {
      await db.insert(pages).values({ title: page.title, slug: page.slug, content: `<h1>${page.title}</h1><p>Content coming soon.</p>`, is_visible: page.is_visible });
      c++;
    } else s++;
  }
  console.log(`   ✅ Created: ${c}, Skipped: ${s}`);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 All done! Database is ready.');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run seed:admin  (create admin user separately — needs ADMIN_PASSWORD)');
  console.log('  2. Login to admin panel and add products, images, hero banners');
  console.log('  3. Upload media via admin — all goes to Cloudinary automatically');
  console.log('='.repeat(50) + '\n');
  process.exit(0);
}

seedAll().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
