import { db } from '../src/db/client';
import { wholesale_tiers } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const WHOLESALE_TIERS = [
  {
    name: 'Starter',
    slug: 'starter',
    discount_percent: 20,
    min_order_value: 0,       // No minimum
    min_order_quantity: 0,
    default_moq: 10,          // 10 pieces per style
    payment_terms: 'net_30',
    description: 'Perfect for new boutiques and online sellers. 20% off retail price.',
    color: '#10B981',         // green
    priority: 1,
  },
  {
    name: 'Growth',
    slug: 'growth',
    discount_percent: 35,
    min_order_value: 1000000, // ₹10,000 in paise
    min_order_quantity: 50,
    default_moq: 25,
    payment_terms: 'net_45',
    description: 'For established businesses with regular orders. 35% off retail price.',
    color: '#3B82F6',         // blue
    priority: 2,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    discount_percent: 50,
    min_order_value: 5000000, // ₹50,000 in paise
    min_order_quantity: 200,
    default_moq: 50,
    payment_terms: 'net_60',
    description: 'For large distributors and chain stores. 50% off retail price.',
    color: '#8B5CF6',         // purple
    priority: 3,
  },
];

async function seedWholesaleTiers() {
  console.log('🏭 Seeding wholesale tiers...');
  let created = 0;
  let skipped = 0;

  for (const tier of WHOLESALE_TIERS) {
    const existing = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.slug, tier.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`⏭️  Skipped: ${tier.name} — already exists`);
      skipped++;
    } else {
      await db.insert(wholesale_tiers).values({
        ...tier,
        active: true,
      });
      console.log(`✅ ${tier.name} (${tier.discount_percent}% off, ${tier.payment_terms})`);
      created++;
    }
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
}

seedWholesaleTiers().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
