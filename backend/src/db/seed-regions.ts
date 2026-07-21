import { db } from './client';
import { regions } from './schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function seedRegions() {
  console.log('🌱 Seeding Regions...');

  const defaultRegions = [
    {
      name: 'India',
      currency_code: 'inr',
      tax_rate: '18', // GST
      tax_code: 'GST',
    },
    {
      name: 'North America',
      currency_code: 'usd',
      tax_rate: '0', // Sales tax handled differently usually
      tax_code: 'VAT',
    },
    {
      name: 'Europe',
      currency_code: 'eur',
      tax_rate: '20', // VAT average
      tax_code: 'VAT',
    },
  ];

  for (const r of defaultRegions) {
    // Check if exists
    const existing = await db
      .select()
      .from(regions)
      .where(eq(regions.name, r.name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(regions).values(r);
      console.log(`✅ Created region: ${r.name} (${r.currency_code})`);
    } else {
      console.log(`ℹ️ Region ${r.name} already exists.`);
    }
  }

  process.exit(0);
}

seedRegions().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
