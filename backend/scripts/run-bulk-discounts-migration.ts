import postgres from 'postgres';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

const sql = postgres(connectionString);

async function migrate() {
  console.log('Running bulk_discounts migration...');

  try {
    // Create bulk_discounts table
    await sql`
            CREATE TABLE IF NOT EXISTS bulk_discounts (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                product_id UUID REFERENCES products(id),
                variant_id UUID REFERENCES product_variants(id),
                min_quantity INTEGER NOT NULL,
                discount_percent INTEGER NOT NULL,
                description TEXT,
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    console.log('✅ Created bulk_discounts table');

    // Create index
    await sql`CREATE INDEX IF NOT EXISTS idx_bulk_discounts_product ON bulk_discounts(product_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bulk_discounts_variant ON bulk_discounts(variant_id);`;
    console.log('✅ Created bulk_discounts indexes');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
