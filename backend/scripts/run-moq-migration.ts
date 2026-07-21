import postgres from 'postgres';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

const sql = postgres(connectionString);

async function migrate() {
  console.log('Running moq migration...');

  try {
    // Add moq column
    await sql`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS moq integer;`;
    console.log('✅ Added moq column');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
