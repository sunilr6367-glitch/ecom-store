import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

// Note: top-level await is not supported with commonjs modules (see tsconfig.json).
// Use an async IIFE so this script stays runnable under the current backend config.
void (async () => {
  console.log('Adding reset password columns to customers table...');

  try {
    await db.execute(sql`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_token text;
    `);
    console.log('Added reset_token column');

    await db.execute(sql`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp;
    `);
    console.log('Added reset_token_expires_at column');

    await db.execute(sql`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS reset_attempts integer DEFAULT 0;
    `);
    console.log('Added reset_attempts column');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_customers_reset_token ON customers(reset_token);
    `);
    console.log('Created reset_token index');

    console.log('\nAll columns added successfully!');
  } catch (error) {
    console.error('Error adding columns:', error);
  }
})();
