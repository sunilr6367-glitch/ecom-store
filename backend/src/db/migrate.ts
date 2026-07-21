import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  console.log('⏳ Start migrating...');

  // Detect if using Supabase or other cloud PostgreSQL that requires SSL
  // Must match the SSL logic in db/client.ts
  const isSupabase =
    connectionString.includes('supabase.com') ||
    connectionString.includes('aws-0-');
  const requiresSsl =
    isSupabase || process.env.DATABASE_SSL === 'true';

  // Connection for migration — include SSL config for cloud DBs
  const migrationClient = postgres(connectionString, {
    max: 1,
    ssl: requiresSsl ? { rejectUnauthorized: false } : false,
  });
  const db = drizzle(migrationClient);

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('✅ Migrations completed successfully!');

  await migrationClient.end();
}

runMigration().catch((err) => {
  console.error('❌ Migration failed!');
  console.error(err);
  process.exit(1);
});
