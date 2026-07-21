import postgres from 'postgres';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

const sql = postgres(connectionString);

async function migrate() {
  console.log('Running wholesale_price migration...');

  try {
    // Add wholesale_price column
    await sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS wholesale_price integer;`;
    console.log('✅ Added wholesale_price column');

    // Create index
    await sql`CREATE INDEX IF NOT EXISTS idx_product_variants_wholesale_price ON product_variants(wholesale_price) WHERE wholesale_price IS NOT NULL;`;
    console.log('✅ Created wholesale_price index');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
