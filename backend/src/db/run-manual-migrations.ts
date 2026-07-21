/**
 * run-manual-migrations.ts
 *
 * Runs the hand-written SQL migration files in src/db/migrations/ in
 * chronological order.  These are NOT tracked by the Drizzle journal and
 * must be applied separately after `npm run migrate:prod`.
 *
 * All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS, so this
 * script is safe to re-run.
 *
 * Usage (on VPS):
 *   docker exec -it odhvica-backend-1 npm run migrate:manual
 *
 * Or directly:
 *   NODE_ENV=production tsx src/db/run-manual-migrations.ts
 */

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import 'dotenv/config';

// Migration files in the order they should be applied
const MIGRATION_FILES = [
  '20260218_add_review_images.sql',
  '20260227_add_password_reset_fields.sql',
  '20260309_add_saved_carts_recovery.sql',
  '20260417_add_trending_reel_views.sql',
  '20260423_homepage_merchandising_slots.sql',
  'phase4_returns.sql',
  '20260429_add_trust_items.sql',
  '20260429_add_studio_inquiries.sql',
  '20260430_add_studio_inquiry_messages.sql',
  '20260430_storefront_prototype_parity.sql',
  '20260507_add_security_events.sql',
  '20260508_populate_ai_seo_defaults.sql',
  '20260509_collection_seo_controls.sql',
  '20260509_normalize_trailing_dash_handles.sql',
  '20260509_product_search_vector.sql',
  '20260509_seo_gap_closure.sql',
  '20260509_privacy_policy_update.sql',
  '20260621_critical_integrity.sql',
  '20260621_homepage_social_posts.sql',
];

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function isIdempotentRerunError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('already exists') ||
    normalized.includes('duplicate key value violates unique constraint') ||
    (normalized.includes('constraint') && normalized.includes('already exists')) ||
    (normalized.includes('column') && normalized.includes('already exists')) ||
    (normalized.includes('relation') && normalized.includes('already exists'))
  );
}

async function runManualMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/odhvica_dev';

  const isSupabase =
    connectionString.includes('supabase.com') ||
    connectionString.includes('aws-0-');
  const requiresSsl = isSupabase || process.env.DATABASE_SSL === 'true';
  const rejectUnauthorized =
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';

  const client = postgres(connectionString, {
    max: 1,
    ssl: requiresSsl ? { rejectUnauthorized } : false,
  });

  console.log('🔄 Running manual SQL migrations...\n');

  let applied = 0;
  let failed = 0;

  for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Skipping ${file} — file not found`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`▶  Applying ${file}...`);

    try {
      await client.unsafe(sql);
      console.log(`✅  ${file} applied successfully`);
      applied++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isIdempotentRerunError(msg)) {
        console.warn(`Already applied or safe to skip ${file}: ${msg}`);
        applied++;
        continue;
      }
      console.error(`❌  ${file} failed: ${msg}`);
      failed++;
      // Continue with remaining migrations — don't abort on a single failure
    }
  }

  await client.end();

  console.log(`\n📊 Results: ${applied} applied, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n✅ All manual migrations complete!');
    process.exit(0);
  }
}

runManualMigrations().catch((err) => {
  console.error('❌ Migration runner crashed:', err.message);
  process.exit(1);
});
