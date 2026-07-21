import postgres from 'postgres';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

const sql = postgres(connectionString);

async function migrate() {
  console.log('Running wholesale_tiers migration...');

  try {
    // Create wholesale_tiers table
    await sql`
            CREATE TABLE IF NOT EXISTS wholesale_tiers (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                discount_percent INTEGER NOT NULL,
                min_order_value INTEGER DEFAULT 0,
                min_order_quantity INTEGER DEFAULT 0,
                default_moq INTEGER DEFAULT 1,
                payment_terms TEXT DEFAULT 'net_30',
                description TEXT,
                color TEXT DEFAULT '#3B82F6',
                active BOOLEAN DEFAULT true,
                priority INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    console.log('✅ Created wholesale_tiers table');

    // Insert default tiers
    await sql`
            INSERT INTO wholesale_tiers (name, slug, discount_percent, default_moq, payment_terms, color, priority, description)
            VALUES 
                ('Starter', 'starter', 20, 50, 'net_30', '#3B82F6', 1, 'Entry-level wholesale tier with 20% discount'),
                ('Growth', 'growth', 30, 200, 'net_45', '#8B5CF6', 2, 'Mid-level wholesale tier with 30% discount'),
                ('Enterprise', 'enterprise', 40, 500, 'net_60', '#F59E0B', 3, 'Enterprise wholesale tier with 40% discount')
            ON CONFLICT (slug) DO NOTHING;
        `;
    console.log('✅ Inserted default tiers');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

migrate();
