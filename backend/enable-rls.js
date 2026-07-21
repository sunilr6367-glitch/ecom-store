// =====================================================
// RLS Enable Script - Node.js Automation
// =====================================================
// This script automatically enables RLS on all tables
// and creates service role bypass policies
//
// Run with: node enable-rls.js
// =====================================================

const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// List of all tables
const tables = [
  // Product-related tables
  'products',
  'product_variants',
  'product_options',
  'product_option_values',
  'product_collections',
  'product_categories',
  'product_tags',
  'product_images',
  'product_reviews',
  
  // Catalog tables
  'categories',
  'tags',
  
  // User & Customer tables
  'users',
  'customers',
  'addresses',
  
  // Order-related tables
  'orders',
  'line_items',
  
  // Regional & Pricing tables
  'regions',
  'countries',
  'money_amounts',
  
  // Marketing & Content tables
  'campaigns',
  'discounts',
  'banners',
  'pages',
  'posts',
  
  // Other tables
  'settings',
  'courses',
  'lessons',
  'wholesale_inquiries'
];

async function enableRLS() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting RLS Enablement...\n');
    
    // Step 1: Get list of existing tables from database
    console.log('📋 Step 1: Checking existing tables...');
    const existingTablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = ANY($1)
    `, [tables]);
    
    const existingTables = existingTablesResult.rows.map(r => r.tablename);
    const missingTables = tables.filter(t => !existingTables.includes(t));
    
    console.log(`✅ Found ${existingTables.length} existing tables`);
    if (missingTables.length > 0) {
      console.log(`⚠️  Skipping ${missingTables.length} missing tables: ${missingTables.join(', ')}`);
    }
    console.log();
    
    // Step 2: Create helper function
    console.log('📦 Step 2: Creating helper function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION is_service_role()
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN (current_user = 'postgres' OR current_user LIKE 'postgres.%');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('✅ Helper function created\n');
    
    // Step 3: Enable RLS on existing tables
    console.log('🔒 Step 3: Enabling RLS on all tables...');
    for (const table of existingTables) {
      await client.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      process.stdout.write(`✅ ${table}\n`);
    }
    console.log(`\n✅ RLS enabled on ${existingTables.length} tables\n`);
    
    // Step 4: Create policies for all existing tables
    console.log('🛡️  Step 4: Creating service role policies...');
    for (const table of existingTables) {
      const policyName = `Service role full access on ${table}`;
      
      // Drop existing policy if exists
      await client.query(`
        DROP POLICY IF EXISTS "${policyName}" ON "${table}";
      `);
      
      // Create new policy
      await client.query(`
        CREATE POLICY "${policyName}" ON "${table}"
          FOR ALL TO postgres 
          USING (is_service_role()) 
          WITH CHECK (is_service_role());
      `);
      
      process.stdout.write(`✅ ${table}\n`);
    }
    console.log(`\n✅ Created ${existingTables.length} policies\n`);
    
    // Step 5: Force RLS for all tables
    console.log('🔐 Step 5: Forcing RLS on all tables...');
    for (const table of existingTables) {
      await client.query(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`);
    }
    console.log(`✅ RLS forced on ${existingTables.length} tables\n`);
    
    // Step 6: Verify
    console.log('🔍 Step 6: Verifying setup...');
    const rlsCheck = await client.query(`
      SELECT 
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = ANY($1)
      ORDER BY tablename;
    `, [existingTables]);
    
    const enabled = rlsCheck.rows.filter(r => r.rowsecurity).length;
    const disabled = rlsCheck.rows.filter(r => !r.rowsecurity).length;
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ RLS Enabled: ${enabled} tables`);
    console.log(`   ❌ RLS Disabled: ${disabled} tables`);
    
    if (disabled > 0) {
      console.log(`\n⚠️  Warning: ${disabled} tables still have RLS disabled!`);
    } else {
      console.log(`\n🎉 SUCCESS! RLS is now enabled on all ${existingTables.length} tables!`);
      console.log(`🛡️  Your database is now secured with service role bypass policies.`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
enableRLS();
