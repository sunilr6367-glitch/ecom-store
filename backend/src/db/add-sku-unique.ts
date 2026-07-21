import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

async function addSkuUniqueConstraint() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('⏳ Adding unique constraint to product_variants.sku...');

  const client = postgres(connectionString, { max: 1 });

  try {
    // Check if constraint exists
    const result = await client`
      SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_sku_unique'
    `;

    if (result.length === 0) {
      // Add unique constraint (but only for non-null values - PostgreSQL allows multiple NULLs)
      await client`ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_sku_unique" UNIQUE ("sku")`;
      console.log('✅ Unique constraint added to product_variants.sku!');
    } else {
      console.log('✅ Unique constraint already exists!');
    }
  } catch (error: any) {
    console.log('⚠️ Note:', error.message);
    console.log(
      'This might be okay if there are duplicate SKUs in the database.'
    );
  }

  await client.end();
}

addSkuUniqueConstraint().catch((err) => {
  console.error('❌ Failed!');
  console.error(err);
  process.exit(1);
});
