import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('⏳ Running testimonials migration...');

  // Read the testimonials migration SQL
  const sql = readFileSync(
    join(__dirname, '../../migrations/20260216_testimonials.sql'),
    'utf-8'
  );

  // Connection for migration
  const client = postgres(connectionString, { max: 1 });

  // Split and execute each statement
  const statements = sql.split(';').filter((s) => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await client.unsafe(statement);
    }
  }

  console.log('✅ Testimonials table created successfully!');

  await client.end();
}

runMigration().catch((err) => {
  console.error('❌ Migration failed!');
  console.error(err);
  process.exit(1);
});
