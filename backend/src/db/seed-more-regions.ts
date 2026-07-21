import { db } from './client';
import { regions } from './schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function seedMoreRegions() {
  console.log('🌱 Seeding More Regions...');

  const moreRegions = [
    {
      name: 'United Kingdom',
      currency_code: 'gbp',
      tax_rate: '20',
      tax_code: 'VAT',
    },
    {
      name: 'Middle East (Gulf)',
      currency_code: 'aed',
      tax_rate: '5',
      tax_code: 'VAT',
    },
    {
      name: 'Australia',
      currency_code: 'aud',
      tax_rate: '10',
      tax_code: 'GST',
    },
    {
      name: 'Japan',
      currency_code: 'jpy',
      tax_rate: '10',
      tax_code: 'VAT',
    },
    {
      name: 'Canada',
      currency_code: 'cad',
      tax_rate: '13',
      tax_code: 'HST',
    },
  ];

  for (const r of moreRegions) {
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

seedMoreRegions().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
