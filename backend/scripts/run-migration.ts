import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function runMigration() {
    console.log('Fixing discount_usage table...');

    // Drop existing table if it exists
    await db.execute(sql`DROP TABLE IF EXISTS discount_usage CASCADE`);

    // Create table with only composite primary key (no separate id)
    await db.execute(sql`
    CREATE TABLE discount_usage (
      discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
      customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      PRIMARY KEY (discount_id, customer_id)
    )
  `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_discount_usage_customer_id ON discount_usage(customer_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_discount_usage_discount_id ON discount_usage(discount_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_discount_usage_order_id ON discount_usage(order_id)`);

    console.log('✅ discount_usage table created successfully!');
    console.log('Schema: discount_usage (discount_id, customer_id, order_id, used_at)');
    console.log('Primary Key: (discount_id, customer_id) - ensures one use per customer per discount');
    process.exit(0);
}

runMigration().catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
});
