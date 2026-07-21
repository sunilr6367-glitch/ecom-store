import postgres from 'postgres';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

const sql = postgres(connectionString);

async function migrate() {
  console.log('Running is_wholesale_only migration...');

  try {
    // Add is_wholesale_only column
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_wholesale_only boolean DEFAULT false;`;
    console.log('✅ Added is_wholesale_only column');

    // Create index
    await sql`CREATE INDEX IF NOT EXISTS idx_products_wholesale_only ON products(is_wholesale_only) WHERE is_wholesale_only = true;`;
    console.log('✅ Created is_wholesale_only index');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
