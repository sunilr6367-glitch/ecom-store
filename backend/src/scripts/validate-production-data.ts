/**
 * Pre-deploy production data validation script
 * guide Section 13.2 — all 6 gates (G-01 to G-06)
 * Run: npx tsx src/scripts/validate-production-data.ts
 */

import { db } from '../db/client';
import { products, product_collections, collection_products, categories } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';

const TEST_PATTERN = /^[a-z]{1,5}$|jjj|kkk|hhh|njk|hhjk|test|sample|dummy|temp|xxx/i;

async function validateProductionData() {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Running Odhvica production data validation...\n');

  // G-01: No active products without category
  const orphanProducts = await db
    .select({ id: products.id, title: products.title })
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        sql`NOT EXISTS (
          SELECT 1 FROM product_categories pc
          WHERE pc.product_id = ${products.id}
        )`
      )
    );
  orphanProducts.forEach((p) =>
    errors.push(`G-01 ORPHAN PRODUCT: "${p.title}" (${p.id}) has no category`)
  );

  // G-02: No active collections with < 3 active products
  const allActiveCollections = await db
    .select({
      id: product_collections.id,
      title: product_collections.title,
      handle: product_collections.handle,
    })
    .from(product_collections)
    .where(
      and(
        eq(product_collections.status, 'active'),
        sql`${product_collections.deleted_at} IS NULL`
      )
    );

  for (const col of allActiveCollections) {
    const [{ cnt }] = await db
      .select({ cnt: sql<number>`count(*)`.mapWith(Number) })
      .from(collection_products)
      .innerJoin(products, eq(products.id, collection_products.product_id))
      .where(
        and(
          eq(collection_products.collection_id, col.id),
          eq(products.status, 'published')
        )
      );

    if (cnt < 3) {
      errors.push(
        `G-02 THIN COLLECTION: "${col.title}" (/${col.handle}) is active but has only ${cnt} active products (min 3 required)`
      );
    }
  }

  // G-03: No duplicate collection names (case-insensitive)
  const dupeCollections = await db.execute(sql`
    SELECT lower(title) as name_lower, COUNT(*) as cnt, array_agg(title) as titles
    FROM product_collections
    WHERE deleted_at IS NULL
    GROUP BY lower(title)
    HAVING COUNT(*) > 1
  `);
  const dupeCollectionRows = dupeCollections as unknown as Array<{
    name_lower: string;
    cnt: number | string;
    titles: string[];
  }>;
  dupeCollectionRows.forEach((c) =>
    errors.push(`G-03 DUPLICATE COLLECTION NAME: "${c.name_lower}" appears ${c.cnt} times: ${c.titles.join(', ')}`)
  );

  // G-04: No active collections missing cover_image
  const noImageCollections = await db
    .select({ title: product_collections.title, handle: product_collections.handle })
    .from(product_collections)
    .where(
      and(
        eq(product_collections.status, 'active'),
        sql`${product_collections.deleted_at} IS NULL`,
        sql`${product_collections.cover_image_url} IS NULL AND ${product_collections.image} IS NULL`
      )
    );
  noImageCollections.forEach((c) =>
    warnings.push(`G-04 COLLECTION NO IMAGE: "${c.title}" is active but has no cover image`)
  );

  // G-05: No test products in published status
  const activeProducts = await db
    .select({ id: products.id, title: products.title })
    .from(products)
    .where(eq(products.status, 'published'));

  activeProducts
    .filter((p) => TEST_PATTERN.test(p.title))
    .forEach((p) =>
      errors.push(`G-05 TEST PRODUCT IN PRODUCTION: "${p.title}" (${p.id}) matches test pattern`)
    );

  // G-06: No on_request products with price set
  const brokenPriceProducts = await db.execute(sql`
    SELECT p.title, p.id
    FROM products p
    JOIN product_variants pv ON pv.product_id = p.id
    JOIN money_amounts ma ON ma.variant_id = pv.id
    WHERE p.price_type = 'on_request'
      AND ma.amount > 0
  `);
  const brokenPriceRows = brokenPriceProducts as unknown as Array<{
    title: string;
    id: string;
  }>;
  brokenPriceRows.forEach((p) =>
    errors.push(`G-06 PRICE CONFLICT: "${p.title}" is on_request but has price set`)
  );

  // G-07: No products with Title Case violation (warn only)
  const titleCaseViolations = await db
    .select({ title: products.title })
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        sql`${products.title} != initcap(${products.title})`
      )
    );
  titleCaseViolations.forEach((p) =>
    warnings.push(`G-07 TITLE CASE: "${p.title}" is not in Title Case`)
  );

  // G-08: No active categories without image
  const noCatImage = await db
    .select({ name: categories.name, slug: categories.slug })
    .from(categories)
    .where(
      and(
        eq(categories.is_active, true),
        sql`${categories.image} IS NULL`
      )
    );
  noCatImage.forEach((c) =>
    warnings.push(`G-08 CATEGORY NO IMAGE: "${c.name}" (${c.slug}) is active but has no image`)
  );

  // --- REPORT ---
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━');
  console.log('ODHVICA PRODUCTION VALIDATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errors.length > 0) {
    console.error(`❌ ERRORS (${errors.length}) — deployment blocked:\n`);
    errors.forEach((e) => console.error(`  • ${e}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.warn(`⚠️  WARNINGS (${warnings.length}) — review recommended:\n`);
    warnings.forEach((w) => console.warn(`  • ${w}`));
    console.log('');
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All validation checks passed. Safe to deploy.\n');
  } else if (errors.length === 0) {
    console.log(`✅ No errors. ${warnings.length} warning(s) — safe to deploy but review recommended.\n`);
  } else {
    console.error(`\n🚫 VALIDATION FAILED: ${errors.length} error(s) must be fixed before deployment.\n`);
    process.exit(1);
  }
}

validateProductionData().catch((err) => {
  console.error('Validation script crashed:', err);
  process.exit(1);
});
