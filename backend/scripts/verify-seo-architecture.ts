import postgres from 'postgres';
import 'dotenv/config';

type Check = {
  name: string;
  ok: boolean;
  details?: string;
};

const REQUIRED_TABLES = [
  'product_seo',
  'product_attributes',
  'attribute_values',
  'product_attribute_values',
  'product_discovery',
  'product_variant_merchant',
  'product_media_seo',
  'seo_landing_pages',
  'search_synonyms',
  'search_query_logs',
  'product_embeddings',
  'product_reviews',
  'artisans',
  'hreflang_groups',
  'market_policies',
  'gsc_performance',
  'competitor_keywords',
  'merchant_feed_health',
];

const REQUIRED_COLUMNS: Record<string, string[]> = {
  product_seo: [
    'product_id',
    'seo_title',
    'meta_description',
    'canonical_url',
    'robots_index',
    'robots_follow',
    'og_title',
    'og_description',
    'og_image_url',
    'twitter_card',
    'schema_overrides',
    'localized_metadata',
    'hreflang_group_id',
    'seo_score',
  ],
  product_discovery: [
    'product_id',
    'primary_keyword',
    'secondary_keywords',
    'long_tail_keywords',
    'search_intents',
    'semantic_entities',
    'negative_keywords',
    'product_document',
    'document_hash',
  ],
  product_variant_merchant: [
    'variant_id',
    'gtin',
    'mpn',
    'item_group_id',
    'color',
    'size',
    'size_system',
    'gender',
    'age_group',
    'condition',
    'google_product_category',
    'material',
    'pattern',
    'feed_enabled',
  ],
  seo_landing_pages: [
    'id',
    'slug',
    'title',
    'meta_description',
    'intro_content',
    'outro_content',
    'rule_definition',
    'canonical_url',
    'robots_index',
    'robots_follow',
    'hreflang_group_id',
    'status',
    'priority',
    'localized_metadata',
  ],
  search_synonyms: ['id', 'locale', 'term', 'normalized_term', 'synonyms', 'boost'],
  product_embeddings: ['product_id', 'locale', 'source_hash', 'document', 'embedding'],
  product_media_seo: ['image_id', 'cloudinary_public_id', 'media_type'],
  product_reviews: ['id', 'verified_purchase'],
  market_policies: ['locale', 'market_code', 'shipping_content', 'returns_content'],
  hreflang_groups: ['canonical_url', 'locale', 'localized_url'],
  gsc_performance: ['date', 'page', 'clicks', 'impressions', 'ctr', 'position'],
  artisans: ['name', 'slug', 'craft_specialty', 'knows_about', 'has_occupation'],
};

const REQUIRED_INDEXES = [
  'idx_product_seo_score',
  'idx_product_seo_robots',
  'idx_product_attributes_code',
  'idx_attribute_values_unique_attr_slug',
  'idx_product_attribute_values_product',
  'idx_product_discovery_document_hash',
  'idx_product_variant_merchant_feed',
  'idx_seo_landing_pages_indexable',
  'idx_search_synonyms_term',
  'idx_search_query_logs_zero_result',
  'idx_product_embeddings_hash',
  'idx_product_embeddings_vector',
  'idx_artisans_slug',
  'idx_hreflang_groups_locale',
  'idx_market_policies_market',
  'idx_gsc_performance_page',
  'idx_products_title_trgm',
  'idx_products_description_trgm',
];

function isSslRequired(connectionString: string) {
  return (
    connectionString.includes('supabase.com') ||
    connectionString.includes('aws-0-') ||
    process.env.DATABASE_SSL === 'true'
  );
}

function printCheck(check: Check) {
  const prefix = check.ok ? '[PASS]' : '[FAIL]';
  console.log(`${prefix} ${check.name}${check.details ? ` - ${check.details}` : ''}`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[SKIP] DATABASE_URL is not set. Live SEO architecture verification was skipped.');
    process.exit(0);
  }

  const client = postgres(connectionString, {
    max: 1,
    ssl: isSslRequired(connectionString) ? { rejectUnauthorized: false } : false,
  });

  const checks: Check[] = [];

  try {
    const extensionRows = await client<{ exists: boolean }[]>`
      select exists(select 1 from pg_extension where extname = 'pg_trgm') as exists
    `;
    checks.push({
      name: 'pg_trgm extension installed',
      ok: Boolean(extensionRows[0]?.exists),
      details: extensionRows[0]?.exists ? 'trigram search ready' : 'required for typo-tolerant search',
    });

    for (const tableName of REQUIRED_TABLES) {
      const rows = await client<{ exists: boolean }[]>`
        select to_regclass(${`public.${tableName}`}) is not null as exists
      `;
      checks.push({
        name: `table ${tableName}`,
        ok: Boolean(rows[0]?.exists),
      });
    }

    for (const [tableName, requiredColumns] of Object.entries(REQUIRED_COLUMNS)) {
      const rows = await client<{ column_name: string }[]>`
        select column_name
        from information_schema.columns
        where table_schema = 'public' and table_name = ${tableName}
      `;
      const actual = new Set(rows.map((row) => row.column_name));
      const missing = requiredColumns.filter((columnName) => !actual.has(columnName));
      checks.push({
        name: `columns ${tableName}`,
        ok: missing.length === 0,
        details: missing.length ? `missing ${missing.join(', ')}` : `${requiredColumns.length} columns present`,
      });
    }

    for (const indexName of REQUIRED_INDEXES) {
      const rows = await client<{ exists: boolean }[]>`
        select exists(select 1 from pg_indexes where schemaname = 'public' and indexname = ${indexName}) as exists
      `;
      checks.push({
        name: `index ${indexName}`,
        ok: Boolean(rows[0]?.exists),
      });
    }

    const seedRows = await client<{ attributes: number; synonyms: number }[]>`
      select
        (select count(*)::int from product_attributes where code in ('fabric', 'technique', 'occasion', 'style', 'color', 'region', 'artisan_type')) as attributes,
        (select count(*)::int from search_synonyms where locale = 'en') as synonyms
    `;
    checks.push({
      name: 'fashion SEO seed data',
      ok: Number(seedRows[0]?.attributes || 0) >= 7 && Number(seedRows[0]?.synonyms || 0) >= 6,
      details: `${seedRows[0]?.attributes || 0} attributes, ${seedRows[0]?.synonyms || 0} synonyms`,
    });

    const backfillRows = await client<{ products: number; seo_rows: number; discovery_rows: number }[]>`
      select
        (select count(*)::int from products) as products,
        (select count(*)::int from product_seo) as seo_rows,
        (select count(*)::int from product_discovery) as discovery_rows
    `;
    const productCount = Number(backfillRows[0]?.products || 0);
    const seoRows = Number(backfillRows[0]?.seo_rows || 0);
    const discoveryRows = Number(backfillRows[0]?.discovery_rows || 0);
    checks.push({
      name: 'legacy product SEO backfill coverage',
      ok: productCount === 0 || (seoRows >= productCount && discoveryRows >= productCount),
      details: `${productCount} products, ${seoRows} SEO rows, ${discoveryRows} discovery rows`,
    });

    const unsafeLandingRows = await client<{ count: number }[]>`
      select count(*)::int as count
      from seo_landing_pages
      where status = 'active'
        and robots_index is true
        and (meta_description is null or length(trim(meta_description)) = 0)
    `;
    checks.push({
      name: 'active indexable landing pages have metadata',
      ok: Number(unsafeLandingRows[0]?.count || 0) === 0,
      details: `${unsafeLandingRows[0]?.count || 0} unsafe active pages`,
    });
  } finally {
    await client.end();
  }

  checks.forEach(printCheck);

  const failures = checks.filter((check) => !check.ok);
  if (failures.length > 0) {
    console.error(`\nSEO architecture verification failed: ${failures.length} issue(s).`);
    process.exit(1);
  }

  console.log('\nSEO architecture verification passed.');
}

main().catch((error) => {
  console.error('[FAIL] SEO architecture verification crashed');
  console.error(error);
  process.exit(1);
});
