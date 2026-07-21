import postgres from 'postgres';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

const sql = postgres(connectionString, {
  ssl: connectionString.includes('supabase.com') || connectionString.includes('aws-0-')
    ? { rejectUnauthorized: false }
    : false,
  prepare: false,
});

async function migrate() {
  console.log('🚀 Running Odhvica new tables migration...\n');

  try {
    // --- 1. SAVED CARTS ---
    console.log('Creating saved_carts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS saved_carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
        session_id TEXT,
        items JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_carts_customer_id ON saved_carts(customer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_carts_session_id ON saved_carts(session_id)`;
    console.log('✅ saved_carts table created\n');

    // --- 2. BACK IN STOCK SUBSCRIPTIONS ---
    console.log('Creating back_in_stock_subscriptions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS back_in_stock_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        notified BOOLEAN DEFAULT FALSE,
        notified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_bis_product_id ON back_in_stock_subscriptions(product_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bis_email ON back_in_stock_subscriptions(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bis_notified ON back_in_stock_subscriptions(notified)`;
    console.log('✅ back_in_stock_subscriptions table created\n');

    // --- 3. WISHLISTS ---
    console.log('Creating wishlists table...');
    await sql`
      CREATE TABLE IF NOT EXISTS wishlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT wishlists_customer_product_pk UNIQUE (customer_id, product_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON wishlists(customer_id)`;
    console.log('✅ wishlists table created\n');

    // --- VERIFY ---
    console.log('Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('saved_carts', 'back_in_stock_subscriptions', 'wishlists')
      ORDER BY table_name
    `;
    console.log(`✅ Verified ${tables.length}/3 tables exist:`);
    tables.forEach((t: any) => console.log(`   - ${t.table_name}`));

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
