import 'dotenv/config';
import { db } from '../src/db/client';
import { money_amounts, regions, product_variants } from '../src/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function fix() {
  console.log('--- DB VERIFICATION & FIX START ---');

  // 1. Get India region ID
  const indiaQuery = await db.select({ id: regions.id }).from(regions).where(eq(regions.currency_code, 'inr')).limit(1);
  const inrRegionId = indiaQuery[0]?.id;

  if (!inrRegionId) {
    console.log('India region not found! Cannot fix.');
    process.exit(1);
  }

  console.log(`India Region ID: ${inrRegionId}`);

  // 2. Count broken rows
  const brokenQuery = await db.select({ count: sql<number>`count(*)` })
    .from(money_amounts)
    .where(and(eq(money_amounts.currency_code, 'inr'), isNull(money_amounts.region_id)));
  
  const initialBrokenCount = Number(brokenQuery[0].count);
  console.log(`Initial broken money_amounts (inr & region_id IS NULL): ${initialBrokenCount}`);

  // 3. Update them
  if (initialBrokenCount > 0) {
    console.log(`Fixing ${initialBrokenCount} broken rows by assigning India region_id...`);
    await db.update(money_amounts)
      .set({ region_id: inrRegionId })
      .where(and(eq(money_amounts.currency_code, 'inr'), isNull(money_amounts.region_id)));
    console.log('Update complete.');
  }

  // 4. Verification after update
  const finalBrokenQuery = await db.select({ count: sql<number>`count(*)` })
    .from(money_amounts)
    .where(and(eq(money_amounts.currency_code, 'inr'), isNull(money_amounts.region_id)));
  
  console.log(`Final broken money_amounts (should be 0): ${finalBrokenQuery[0].count}`);

  // Total variants
  const totalVariants = await db.select({ count: sql<number>`count(*)` }).from(product_variants);
  console.log(`Total variants in production: ${totalVariants[0].count}`);

  // Specific variant check
  const specificVariantId = 'af21f87e-40f6-4cd7-968f-1955e5961b48';
  const specificPrice = await db.select({ region_id: money_amounts.region_id, amount: money_amounts.amount })
    .from(money_amounts)
    .where(eq(money_amounts.variant_id, specificVariantId))
    .limit(1);
  
  if (specificPrice.length > 0) {
    console.log(`Variant ${specificVariantId} exists! region_id: ${specificPrice[0].region_id || 'NULL'}, amount: ${specificPrice[0].amount}`);
  } else {
    console.log(`Variant ${specificVariantId} DOES NOT EXIST in money_amounts table.`);
  }

  console.log('--- DB VERIFICATION & FIX END ---');
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
