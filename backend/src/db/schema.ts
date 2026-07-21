import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  uuid,
  serial,
  index,
  uniqueIndex,
  primaryKey,
  customType,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- UTILS ---
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`;
  },
});

const createdUpdated = {
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  deleted_at: timestamp('deleted_at'),
};

// --- AUTH & USERS (Admins) ---
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    role: text('role').default('admin'),
    two_factor_secret: text('two_factor_secret'),
    two_factor_enabled: boolean('two_factor_enabled').default(false),
    // 🔒 Q9: Account lockout fields
    failed_login_attempts: integer('failed_login_attempts').default(0),
    locked_until: timestamp('locked_until'),
    ...createdUpdated,
  },
  (table) => ({
    // Index for lockout lookup
    lockedIdx: index('idx_users_locked_until').on(table.locked_until),
  })
);

// --- PRODUCTS ---
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    description: text('description'),
    handle: text('handle').notNull().unique(),
    is_giftcard: boolean('is_giftcard').default(false),
    is_wholesale_only: boolean('is_wholesale_only').default(false), // Only visible to wholesale customers
    status: text('status').default('draft'), // draft, published, proposed, rejected
    thumbnail: text('thumbnail'),
    weight: integer('weight'),
    length: integer('length'),
    height: integer('height'),
    width: integer('width'),
    origin_country: text('origin_country'),
    hs_code: text('hs_code'),
    mid_code: text('mid_code'),
    material: text('material'),
    collection_id: uuid('collection_id'),
    type_id: uuid('type_id'),
    discountable: boolean('discountable').default(true),
    size_guide: text('size_guide'),
    care_instructions: text('care_instructions'),
    price_type: text('price_type').default('fixed'), // fixed | on_request
    seo_title: text('seo_title'),
    seo_description: text('seo_description'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index('idx_products_status').on(table.status),
    createdAtIndex: index('idx_products_created_at').on(table.created_at),
    collectionIdx: index('idx_products_collection_id').on(table.collection_id),
  })
);

export const product_variants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    product_id: uuid('product_id')
      .references(() => products.id)
      .notNull(),
    title: text('title').notNull(),
    sku: text('sku'),
    barcode: text('barcode'),
    ean: text('ean'),
    upc: text('upc'),
    inventory_quantity: integer('inventory_quantity').default(0), // 🔒 FIX-001: Database CHECK constraint in migration 20260211_inventory_check_constraint.sql
    allow_backorder: boolean('allow_backorder').default(false),
    manage_inventory: boolean('manage_inventory').default(true),
    hs_code: text('hs_code'),
    origin_country: text('origin_country'),
    mid_code: text('mid_code'),
    material: text('material'),
    weight: integer('weight'),
    length: integer('length'),
    height: integer('height'),
    width: integer('width'),
    wholesale_price: integer('wholesale_price'), // Price in cents for wholesale customers
    compare_at_price: integer('compare_at_price'), // Original price before discount in cents
    moq: integer('moq'), // Minimum Order Quantity for wholesale customers
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    productIdx: index('idx_product_variants_product_id').on(table.product_id),
  })
);

export const product_options = pgTable('product_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  title: text('title').notNull(), // e.g. "Size", "Color"
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const product_option_values = pgTable('product_option_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  variant_id: uuid('variant_id')
    .references(() => product_variants.id)
    .notNull(),
  option_id: uuid('option_id')
    .references(() => product_options.id)
    .notNull(),
  value: text('value').notNull(), // e.g. "Large", "Red"
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const product_collections = pgTable(
  'product_collections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    handle: text('handle').notNull().unique(),
    image: text('image'),
    // v2 fields
    type: text('type'), // occasion | seasonal | price | fabric | gift | style
    rule_type: text('rule_type').default('manual'), // manual | auto
    rule_definition: jsonb('rule_definition'),
    description: text('description'),
    cover_image_url: text('cover_image_url'),
    status: text('status').default('draft'), // draft | active | archived
    display_order: integer('display_order').default(0),
    show_in_megamenu: boolean('show_in_megamenu').default(false),
    homepage_section: text('homepage_section'),
    valid_from: timestamp('valid_from'),
    valid_until: timestamp('valid_until'),
    seo_title: text('seo_title'),
    seo_desc: text('seo_desc'),
    og_image_url: text('og_image_url'),
    is_indexable: boolean('is_indexable').default(true),
    robots_policy: text('robots_policy').default('index,follow'),
    canonical_url: text('canonical_url'),
    seasonal_flag: text('seasonal_flag').default('evergreen'),
    faq_items: jsonb('faq_items').default([]),
    answer_capsule: text('answer_capsule'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index('idx_collections_status').on(table.status),
    typeIdx: index('idx_collections_type').on(table.type),
    displayOrderIdx: index('idx_collections_display_order').on(table.display_order),
    indexableIdx: index('idx_collections_is_indexable').on(table.is_indexable),
    seasonalIdx: index('idx_collections_seasonal_flag').on(table.seasonal_flag),
  })
);

// M2M junction: products ↔ collections (guide Section 5.4)
export const collection_products = pgTable(
  'collection_products',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    collection_id: uuid('collection_id')
      .references(() => product_collections.id, { onDelete: 'cascade' })
      .notNull(),
    position: integer('position').default(0),
    added_at: timestamp('added_at').defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.collection_id] }),
    collectionIdx: index('idx_cp_collection').on(t.collection_id, t.position),
    productIdx: index('idx_cp_product').on(t.product_id),
  })
);

export const product_images = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  url: text('url').notNull(),
  alt_text: text('alt_text'),
  position: integer('position').default(0),
  // ... existing code ...
  is_thumbnail: boolean('is_thumbnail').default(false),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const product_reviews = pgTable('product_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id')
    .references(() => products.id)
    .notNull(),
  customer_id: uuid('customer_id').references(() => customers.id), // Optional for guest reviews if we allow them, or require auth
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content'),
    status: text('status').default('pending'), // pending, approved, rejected
    author_name: text('author_name').notNull(), // Fallback if no customer_id
    verified_purchase: boolean('verified_purchase').default(false),
    images: jsonb('images').default([]),
    ...createdUpdated,
  });

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    is_active: boolean('is_active').default(true),
    parent_id: uuid('parent_id'),
    metadata: jsonb('metadata'),
    display_order: integer('display_order').default(0),
    show_in_header: boolean('show_in_header').default(true),
    header_image_url: text('header_image_url'),
    emoji: text('emoji'),
    seo_title: text('seo_title'),
    seo_desc: text('seo_desc'),
    og_image_url: text('og_image_url'),
    ...createdUpdated,
  },
  (table) => ({
    parentIdx: index('idx_categories_parent_id').on(table.parent_id),
    displayOrderIdx: index('idx_categories_display_order').on(table.display_order),
    showInHeaderIdx: index('idx_categories_show_in_header').on(table.show_in_header),
  })
);

// Self-reference must be handled carefully or via relations if circular reference occurs in declaration
// But here parent_id is just a uuid column. The FK constraint can be added if needed, or handled via relations.
// For now let's keep it simple.

export const product_categories = pgTable(
  'product_categories',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    category_id: uuid('category_id')
      .references(() => categories.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.category_id] }),
  })
);

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const product_tags = pgTable(
  'product_tags',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    tag_id: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.product_id, t.tag_id] }),
  })
);

// --- SEO, DISCOVERY & AI COMMERCE ---

export const product_seo = pgTable(
  'product_seo',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .primaryKey(),
    seo_title: text('seo_title'),
    meta_description: text('meta_description'),
    canonical_url: text('canonical_url'),
    robots_index: boolean('robots_index').default(true),
    robots_follow: boolean('robots_follow').default(true),
    og_title: text('og_title'),
    og_description: text('og_description'),
    og_image_url: text('og_image_url'),
    twitter_card: text('twitter_card').default('summary_large_image'),
    schema_overrides: jsonb('schema_overrides'),
    localized_metadata: jsonb('localized_metadata'),
    hreflang_group_id: text('hreflang_group_id'),
    seo_score: integer('seo_score').default(0),
    ...createdUpdated,
  },
  (table) => ({
    scoreIdx: index('idx_product_seo_score').on(table.seo_score),
    robotsIdx: index('idx_product_seo_robots').on(table.robots_index, table.robots_follow),
  })
);

export const product_attributes = pgTable(
  'product_attributes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    label: text('label').notNull(),
    type: text('type').default('text'),
    facet_enabled: boolean('facet_enabled').default(true),
    seo_enabled: boolean('seo_enabled').default(true),
    merchant_mapping: text('merchant_mapping'),
    display_order: integer('display_order').default(0),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    codeIdx: index('idx_product_attributes_code').on(table.code),
    displayIdx: index('idx_product_attributes_display').on(table.display_order),
  })
);

export const attribute_values = pgTable(
  'attribute_values',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    attribute_id: uuid('attribute_id')
      .references(() => product_attributes.id, { onDelete: 'cascade' })
      .notNull(),
    slug: text('slug').notNull(),
    label: text('label').notNull(),
    synonyms: jsonb('synonyms'),
    locale_labels: jsonb('locale_labels'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    attrSlugIdx: index('idx_attribute_values_attr_slug').on(table.attribute_id, table.slug),
    labelIdx: index('idx_attribute_values_label').on(table.label),
  })
);

export const product_attribute_values = pgTable(
  'product_attribute_values',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    attribute_id: uuid('attribute_id')
      .references(() => product_attributes.id, { onDelete: 'cascade' })
      .notNull(),
    value_id: uuid('value_id').references(() => attribute_values.id, {
      onDelete: 'set null',
    }),
    raw_value: text('raw_value'),
    source: text('source').default('admin'),
    confidence: integer('confidence').default(100),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    productIdx: index('idx_product_attribute_values_product').on(table.product_id),
    attributeIdx: index('idx_product_attribute_values_attribute').on(table.attribute_id),
    valueIdx: index('idx_product_attribute_values_value').on(table.value_id),
  })
);

export const product_discovery = pgTable(
  'product_discovery',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .primaryKey(),
    primary_keyword: text('primary_keyword'),
    secondary_keywords: jsonb('secondary_keywords'),
    long_tail_keywords: jsonb('long_tail_keywords'),
    search_intents: jsonb('search_intents'),
    semantic_entities: jsonb('semantic_entities'),
    negative_keywords: jsonb('negative_keywords'),
    product_document: text('product_document'),
    document_hash: text('document_hash'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    primaryKeywordIdx: index('idx_product_discovery_primary_keyword').on(table.primary_keyword),
    hashIdx: index('idx_product_discovery_document_hash').on(table.document_hash),
  })
);

export const product_variant_merchant = pgTable(
  'product_variant_merchant',
  {
    variant_id: uuid('variant_id')
      .references(() => product_variants.id, { onDelete: 'cascade' })
      .primaryKey(),
    gtin: text('gtin'),
    mpn: text('mpn'),
    item_group_id: text('item_group_id'),
    color: text('color'),
    size: text('size'),
    size_system: text('size_system'),
    size_type: text('size_type'),
    gender: text('gender'),
    age_group: text('age_group'),
    condition: text('condition').default('new'),
    google_product_category: text('google_product_category'),
    material: text('material'),
    pattern: text('pattern'),
    shipping_weight: integer('shipping_weight'),
    feed_enabled: boolean('feed_enabled').default(false),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    itemGroupIdx: index('idx_product_variant_merchant_item_group').on(table.item_group_id),
    feedIdx: index('idx_product_variant_merchant_feed').on(table.feed_enabled),
  })
);

export const product_media_seo = pgTable(
  'product_media_seo',
  {
    image_id: uuid('image_id')
      .references(() => product_images.id, { onDelete: 'cascade' })
      .primaryKey(),
    alt_text: text('alt_text'),
    image_role: text('image_role'),
    view_type: text('view_type'),
    color: text('color'),
    seo_filename: text('seo_filename'),
    cloudinary_public_id: text('cloudinary_public_id'),
    media_type: text('media_type').default('image'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    roleIdx: index('idx_product_media_seo_role').on(table.image_role),
  })
);

export const seo_landing_pages = pgTable(
  'seo_landing_pages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    meta_description: text('meta_description'),
    intro_content: text('intro_content'),
    outro_content: text('outro_content'),
    rule_definition: jsonb('rule_definition'),
    canonical_url: text('canonical_url'),
    robots_index: boolean('robots_index').default(true),
    robots_follow: boolean('robots_follow').default(true),
    hreflang_group_id: text('hreflang_group_id'),
    status: text('status').default('draft'),
    priority: integer('priority').default(50),
    localized_metadata: jsonb('localized_metadata'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    slugIdx: index('idx_seo_landing_pages_slug').on(table.slug),
    statusIdx: index('idx_seo_landing_pages_status').on(table.status),
    indexableIdx: index('idx_seo_landing_pages_indexable').on(table.status, table.robots_index),
  })
);

export const search_synonyms = pgTable(
  'search_synonyms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locale: text('locale').default('en'),
    term: text('term').notNull(),
    normalized_term: text('normalized_term').notNull(),
    synonyms: jsonb('synonyms'),
    boost: integer('boost').default(1),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    termIdx: index('idx_search_synonyms_term').on(table.locale, table.normalized_term),
  })
);

export const search_query_logs = pgTable(
  'search_query_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    query: text('query').notNull(),
    normalized_query: text('normalized_query'),
    locale: text('locale').default('en'),
    result_count: integer('result_count').default(0),
    clicked_product_id: uuid('clicked_product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    source: text('source').default('storefront'),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    queryIdx: index('idx_search_query_logs_query').on(table.normalized_query),
    zeroResultIdx: index('idx_search_query_logs_zero_result').on(table.result_count),
    createdIdx: index('idx_search_query_logs_created').on(table.created_at),
  })
);

export const product_embeddings = pgTable(
  'product_embeddings',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .primaryKey(),
    locale: text('locale').default('en'),
    source_hash: text('source_hash'),
    document: text('document'),
    embedding: vector('embedding'),
    metadata: jsonb('metadata'),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    localeIdx: index('idx_product_embeddings_locale').on(table.locale),
    hashIdx: index('idx_product_embeddings_hash').on(table.source_hash),
  })
);

export const artisans = pgTable(
  'artisans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    bio: text('bio'),
    craft_specialty: text('craft_specialty'),
    location: text('location'),
    image_url: text('image_url'),
    knows_about: jsonb('knows_about').default([]),
    has_occupation: text('has_occupation').default('Textile artisan'),
    same_as: jsonb('same_as').default([]),
    status: text('status').default('active'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    slugIdx: index('idx_artisans_slug').on(table.slug),
    statusIdx: index('idx_artisans_status').on(table.status),
  })
);

export const product_artisans = pgTable(
  'product_artisans',
  {
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    artisan_id: uuid('artisan_id')
      .references(() => artisans.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').default('creator'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.product_id, table.artisan_id] }),
    productIdx: index('idx_product_artisans_product').on(table.product_id),
    artisanIdx: index('idx_product_artisans_artisan').on(table.artisan_id),
  })
);

export const hreflang_groups = pgTable(
  'hreflang_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entity_type: text('entity_type').notNull(),
    entity_id: text('entity_id'),
    canonical_url: text('canonical_url').notNull(),
    locale: text('locale').notNull(),
    localized_url: text('localized_url').notNull(),
    is_default: boolean('is_default').default(false),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    entityIdx: index('idx_hreflang_groups_entity').on(table.entity_type, table.entity_id),
    localeIdx: index('idx_hreflang_groups_locale').on(table.locale),
  })
);

export const market_policies = pgTable(
  'market_policies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    locale: text('locale').notNull(),
    market_code: text('market_code').notNull(),
    shipping_title: text('shipping_title'),
    shipping_content: text('shipping_content'),
    returns_title: text('returns_title'),
    returns_content: text('returns_content'),
    currency_code: text('currency_code'),
    status: text('status').default('active'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    marketIdx: index('idx_market_policies_market').on(table.locale, table.market_code),
    statusIdx: index('idx_market_policies_status').on(table.status),
  })
);

export const gsc_performance = pgTable(
  'gsc_performance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    date: timestamp('date').notNull(),
    page: text('page').notNull(),
    query: text('query'),
    locale: text('locale').default('en'),
    clicks: integer('clicks').default(0),
    impressions: integer('impressions').default(0),
    ctr: decimal('ctr').default('0'),
    position: decimal('position').default('0'),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    pageIdx: index('idx_gsc_performance_page').on(table.page),
    dateIdx: index('idx_gsc_performance_date').on(table.date),
  })
);

export const competitor_keywords = pgTable(
  'competitor_keywords',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    keyword: text('keyword').notNull(),
    competitor_url: text('competitor_url'),
    locale: text('locale').default('en'),
    search_volume: integer('search_volume'),
    difficulty: integer('difficulty'),
    priority: integer('priority').default(50),
    status: text('status').default('candidate'),
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    keywordIdx: index('idx_competitor_keywords_keyword').on(table.keyword),
    statusIdx: index('idx_competitor_keywords_status').on(table.status),
  })
);

export const merchant_feed_health = pgTable(
  'merchant_feed_health',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    channel: text('channel').notNull(),
    status: text('status').default('ok'),
    product_count: integer('product_count').default(0),
    error_count: integer('error_count').default(0),
    errors: jsonb('errors').default([]),
    last_generated_at: timestamp('last_generated_at').defaultNow(),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    channelIdx: index('idx_merchant_feed_health_channel').on(table.channel),
  })
);

// --- INTERNATIONALIZATION ---

export const regions = pgTable('regions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // e.g. "North America", "Europe"
  currency_code: text('currency_code').notNull(), // e.g. "usd", "eur"
  tax_rate: decimal('tax_rate').default('0'),
  tax_code: text('tax_code'),
  payment_providers: text('payment_providers'), // Comma separated IDs
  fulfillment_providers: text('fulfillment_providers'), // Comma separated IDs
  countries: jsonb('countries'), // Array of country ISO codes, e.g. ["IN", "US"]
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const countries = pgTable('countries', {
  id: serial('id').primaryKey(),
  iso_2: text('iso_2').notNull().unique(), // e.g., "us", "in", "de"
  iso_3: text('iso_3'),
  num_code: integer('num_code'),
  name: text('name').notNull(),
  display_name: text('display_name').notNull(),
  region_id: uuid('region_id').references(() => regions.id),
  ...createdUpdated,
});

export const money_amounts = pgTable(
  'money_amounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    currency_code: text('currency_code').notNull(), // "usd", "inr"
    amount: integer('amount').notNull(), // Stored in cents/lowest unit
    min_quantity: integer('min_quantity').default(1),
    max_quantity: integer('max_quantity'),
    variant_id: uuid('variant_id').references(() => product_variants.id),
    region_id: uuid('region_id').references(() => regions.id),
    ...createdUpdated,
  },
  (table) => ({
    variantIdx: index('idx_money_amounts_variant_id').on(table.variant_id),
    regionIdx: index('idx_money_amounts_region_id').on(table.region_id),
  })
);

// --- ORDERS & CUSTOMERS ---

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    phone: text('phone'),
    has_account: boolean('has_account').default(false),
    password_hash: text('password_hash'), // Nullable for guest checkouts
    // 🔒 FIX-011: Email verification fields
    email_verified: boolean('email_verified').default(false),
    verification_token: text('verification_token'),
    verification_expires_at: timestamp('verification_expires_at'),
    verification_attempts: integer('verification_attempts').default(0),
    // 🔒 Q9: Account lockout fields
    failed_login_attempts: integer('failed_login_attempts').default(0),
    locked_until: timestamp('locked_until'),
    // 🔒 Password reset fields
    reset_token: text('reset_token'),
    reset_token_expires_at: timestamp('reset_token_expires_at'),
    reset_attempts: integer('reset_attempts').default(0),
    // Wholesale / general metadata (discount_tier, wholesale_customer flag, etc.)
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    createdAtIndex: index('idx_customers_created_at').on(table.created_at),
    lockedIdx: index('idx_customers_locked_until').on(table.locked_until),
    resetTokenIdx: index('idx_customers_reset_token').on(table.reset_token),
  })
);

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  customer_id: uuid('customer_id').references(() => customers.id),
  first_name: text('first_name'),
  last_name: text('last_name'),
  company: text('company'),
  address_1: text('address_1'),
  address_2: text('address_2'),
  city: text('city'),
  country_code: text('country_code'),
  province: text('province'),
  postal_code: text('postal_code'),
  phone: text('phone'),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    status: text('status').default('pending'), // pending, completed, archived, canceled
    fulfillment_status: text('fulfillment_status').default('not_fulfilled'), // not_fulfilled, fulfilled, partially_fulfilled, shipped
    payment_status: text('payment_status').default('awaiting'), // awaiting, captured, refunded
    display_id: serial('display_id'), // User facing ID like #1001

    // Links
    customer_id: uuid('customer_id').references(() => customers.id),
    region_id: uuid('region_id').references(() => regions.id),
    shipping_address_id: uuid('shipping_address_id').references(
      () => addresses.id
    ),
    billing_address_id: uuid('billing_address_id').references(
      () => addresses.id
    ),

    // Money
    currency_code: text('currency_code').notNull(),
    tax_rate: decimal('tax_rate'),

    // Totals (stored as integers)
    subtotal: integer('subtotal').default(0),
    tax_total: integer('tax_total').default(0),
    shipping_total: integer('shipping_total').default(0),
    discount_total: integer('discount_total').default(0),
    discount_id: uuid('discount_id').references(() => discounts.id),
    total: integer('total').default(0), // Final amount to charge

    email: text('email').notNull(), // Snapshot in case customer changes
    tracking_number: text('tracking_number'),
    shipping_carrier: text('shipping_carrier'),
    tracking_link: text('tracking_link'),
    metadata: jsonb('metadata'),
    idempotency_key: text('idempotency_key'),
    ...createdUpdated,
  },
  (table) => ({
    statusIdx: index('idx_orders_status').on(table.status),
    customerIdIdx: index('idx_orders_customer_id').on(table.customer_id),
    regionIdIdx: index('idx_orders_region_id').on(table.region_id),
    discountIdIdx: index('idx_orders_discount_id').on(table.discount_id),
    idempotencyKeyIdx: uniqueIndex('idx_orders_idempotency_key').on(table.idempotency_key),
    createdAtIndex: index('idx_orders_created_at').on(table.created_at),
  })
);

export const line_items = pgTable(
  'line_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    order_id: uuid('order_id')
      .references(() => orders.id)
      .notNull(),
    variant_id: uuid('variant_id').references(() => product_variants.id),
    title: text('title').notNull(),
    description: text('description'),
    thumbnail: text('thumbnail'),
    quantity: integer('quantity').notNull(),
    unit_price: integer('unit_price').notNull(),
    total_price: integer('total_price').notNull(), // quantity * unit_price
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    orderIdx: index('idx_line_items_order_id').on(table.order_id),
    variantIdx: index('idx_line_items_variant_id').on(table.variant_id),
  })
);

// --- RELATIONS ---

export const productsRelations = relations(products, ({ one, many }) => ({
  variants: many(product_variants),
  options: many(product_options),
  images: many(product_images),
  collection: one(product_collections, {
    fields: [products.collection_id],
    references: [product_collections.id],
  }),
  categories: many(product_categories),
  tags: many(product_tags),
}));

export const productImagesRelations = relations(product_images, ({ one }) => ({
  product: one(products, {
    fields: [product_images.product_id],
    references: [products.id],
  }),
}));

export const productReviewsRelations = relations(
  product_reviews,
  ({ one }) => ({
    product: one(products, {
      fields: [product_reviews.product_id],
      references: [products.id],
    }),
    customer: one(customers, {
      fields: [product_reviews.customer_id],
      references: [customers.id],
    }),
  })
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: 'child_categories',
  }),
  children: many(categories, {
    relationName: 'child_categories',
  }),
  products: many(product_categories),
}));

export const productCategoriesRelations = relations(
  product_categories,
  ({ one }) => ({
    product: one(products, {
      fields: [product_categories.product_id],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [product_categories.category_id],
      references: [categories.id],
    }),
  })
);

export const tagsRelations = relations(tags, ({ many }) => ({
  products: many(product_tags),
}));

export const productTagsRelations = relations(product_tags, ({ one }) => ({
  product: one(products, {
    fields: [product_tags.product_id],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [product_tags.tag_id],
    references: [tags.id],
  }),
}));

export const productVariantsRelations = relations(
  product_variants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [product_variants.product_id],
      references: [products.id],
    }),
    prices: many(money_amounts),
    option_values: many(product_option_values),
  })
);

export const moneyAmountsRelations = relations(money_amounts, ({ one }) => ({
  variant: one(product_variants, {
    fields: [money_amounts.variant_id],
    references: [product_variants.id],
  }),
  region: one(regions, {
    fields: [money_amounts.region_id],
    references: [regions.id],
  }),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  countries: many(countries),
}));

export const countriesRelations = relations(countries, ({ one }) => ({
  region: one(regions, {
    fields: [countries.region_id],
    references: [regions.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  addresses: many(addresses),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, {
    fields: [addresses.customer_id],
    references: [customers.id],
  }),
}));

export const lineItemsRelations = relations(line_items, ({ one }) => ({
  order: one(orders, {
    fields: [line_items.order_id],
    references: [orders.id],
  }),
  variant: one(product_variants, {
    fields: [line_items.variant_id],
    references: [product_variants.id],
  }),
}));

// --- SETTINGS ---
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value'),
  category: text('category').default('general'), // general, notifications, security, email, payment, shipping
  ...createdUpdated,
});

// Alias for checkout.ts which imports store_settings
// (same table as settings — stores shipping rates, tax, etc.)
export const store_settings = settings;

// --- MARKETING CAMPAIGNS ---
export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').default('promotion'), // promotion, email, social
  status: text('status').default('draft'), // draft, active, paused, completed
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  budget: integer('budget'), // in cents
  spent: integer('spent').default(0), // in cents
  customers_reached: integer('customers_reached').default(0),
  conversions: integer('conversions').default(0),
  revenue: integer('revenue').default(0), // in cents
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

// --- DISCOUNT CODES ---
export const discounts = pgTable('discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(), // percentage, fixed_amount, free_shipping
  value: integer('value').notNull(), // percentage (0-100) or amount in cents
  description: text('description'),
  starts_at: timestamp('starts_at'),
  ends_at: timestamp('ends_at'),
  usage_limit: integer('usage_limit'), // null = unlimited
  usage_count: integer('usage_count').default(0),
  min_purchase_amount: integer('min_purchase_amount'), // in cents
  is_active: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  campaign_id: uuid('campaign_id').references(() => campaigns.id),
  ...createdUpdated,
});

// 🔒 FIX-006: Discount usage tracking table (per-customer limits)
export const discount_usage = pgTable(
  'discount_usage',
  {
    discount_id: uuid('discount_id')
      .references(() => discounts.id, { onDelete: 'cascade' })
      .notNull(),
    customer_id: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    order_id: uuid('order_id')
      .references(() => orders.id, { onDelete: 'cascade' })
      .notNull(),
    used_at: timestamp('used_at').defaultNow().notNull(),
  },
  (table) => ({
    // Composite primary key: one use per customer per discount
    pk: primaryKey({
      columns: [table.discount_id, table.customer_id],
      name: 'pk_discount_customer_usage',
    }),
    customerIdx: index('idx_discount_usage_customer_id').on(table.customer_id),
    discountIdx: index('idx_discount_usage_discount_id').on(table.discount_id),
    orderIdx: index('idx_discount_usage_order_id').on(table.order_id),
  })
);

// 🔒 FIX-007: Stripe webhook events table (idempotency)
export const webhook_events = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    event_id: text('event_id').notNull().unique(), // Stripe's event ID
    event_type: text('event_type').notNull(),
    processed_at: timestamp('processed_at'),
    status: text('status').default('pending'), // pending, processed, failed
    metadata: jsonb('metadata'),
    ...createdUpdated,
  },
  (table) => ({
    eventIdIdx: index('idx_webhook_events_event_id').on(table.event_id),
    statusIdx: index('idx_webhook_events_status').on(table.status),
  })
);

// --- WHOLESALE INQUIRIES ---
export const wholesale_inquiries = pgTable('wholesale_inquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  company_name: text('company_name').notNull(),
  contact_name: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  country: text('country').notNull(),
  business_type: text('business_type').notNull(), // boutique, online, distributor, chain, other
  estimated_order_volume: text('estimated_order_volume'), // 50-100, 100-200, 200-500, 500+
  message: text('message'),
  status: text('status').default('pending'), // pending, approved, rejected
  discount_tier: text('discount_tier'), // starter, growth, enterprise
  admin_notes: text('admin_notes'),
  reviewed_by: uuid('reviewed_by').references(() => users.id),
  reviewed_at: timestamp('reviewed_at'),
  ...createdUpdated,
});

// --- WHOLESALE TIERS ---
export const wholesale_tiers = pgTable('wholesale_tiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // e.g., "Starter", "Growth", "Enterprise"
  slug: text('slug').notNull().unique(), // e.g., "starter", "growth", "enterprise"
  discount_percent: integer('discount_percent').notNull(), // e.g., 20 for 20%
  min_order_value: integer('min_order_value').default(0), // Minimum order to qualify (in cents)
  min_order_quantity: integer('min_order_quantity').default(0), // Minimum items to qualify
  default_moq: integer('default_moq').default(1), // Default MOQ for products in this tier
  payment_terms: text('payment_terms').default('net_30'), // net_30, net_45, net_60
  description: text('description'),
  color: text('color').default('#3B82F6'), // UI color for the tier
  active: boolean('active').default(true),
  priority: integer('priority').default(0), // For ordering tiers
  ...createdUpdated,
});

// --- BULK DISCOUNTS ---
export const bulk_discounts = pgTable('bulk_discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  product_id: uuid('product_id').references(() => products.id),
  variant_id: uuid('variant_id').references(() => product_variants.id),
  min_quantity: integer('min_quantity').notNull(), // Minimum quantity for this discount
  discount_percent: integer('discount_percent').notNull(), // Additional discount % for bulk
  description: text('description'),
  active: boolean('active').default(true),
  ...createdUpdated,
});

// --- CONTACT FORM ---
export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// --- PRODUCT STUDIO INQUIRIES ---
export const studio_inquiries = pgTable('studio_inquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversation_token: text('conversation_token'),
  product_id: uuid('product_id').references(() => products.id),
  product_title: text('product_title').notNull(),
  product_handle: text('product_handle'),
  product_url: text('product_url'),
  inquiry_type: text('inquiry_type').default('question'),
  customer_name: text('customer_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  message: text('message').notNull(),
  measurements: jsonb('measurements').default({}),
  status: text('status').default('new'),
  admin_notes: text('admin_notes'),
  last_message_at: timestamp('last_message_at').defaultNow(),
  unread_by_admin: boolean('unread_by_admin').default(true),
  unread_by_customer: boolean('unread_by_customer').default(false),
  ...createdUpdated,
}, (table) => ({
  statusIdx: index('idx_studio_inquiries_status').on(table.status),
  productIdx: index('idx_studio_inquiries_product_id').on(table.product_id),
  createdAtIdx: index('idx_studio_inquiries_created_at').on(table.created_at),
  tokenIdx: index('idx_studio_inquiries_conversation_token').on(table.conversation_token),
}));

export const studio_inquiry_messages = pgTable('studio_inquiry_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  inquiry_id: uuid('inquiry_id').notNull().references(() => studio_inquiries.id),
  sender_type: text('sender_type').notNull(),
  sender_name: text('sender_name'),
  sender_email: text('sender_email'),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  inquiryIdx: index('idx_studio_inquiry_messages_inquiry_id').on(table.inquiry_id),
  createdAtIdx: index('idx_studio_inquiry_messages_created_at').on(table.created_at),
}));

// --- NEWSLETTER ---
export const newsletter_subscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  status: text('status').default('active'),
  created_at: timestamp('created_at').defaultNow(),
});

// --- RELATIONS ---
export const settingsRelations = relations(settings, () => ({}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  discounts: many(discounts),
}));

export const discountsRelations = relations(discounts, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [discounts.campaign_id],
    references: [campaigns.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customer_id],
    references: [customers.id],
  }),
  region: one(regions, {
    fields: [orders.region_id],
    references: [regions.id],
  }),
  shipping_address: one(addresses, {
    fields: [orders.shipping_address_id],
    references: [addresses.id],
    relationName: 'shipping_address',
  }),
  billing_address: one(addresses, {
    fields: [orders.billing_address_id],
    references: [addresses.id],
    relationName: 'billing_address',
  }),
  discount: one(discounts, {
    fields: [orders.discount_id],
    references: [discounts.id],
  }),

  items: many(line_items),
}));

// --- CONTENT MANAGEMENT (Banners) ---
export const banners = pgTable('banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  image_url: text('image_url').notNull(),
  link: text('link'),
  button_text: text('button_text'),
  position: integer('position').default(0), // For ordering
  is_active: boolean('is_active').default(true),
  section: text('section').default('hero'), // hero, collection_header, etc.
  ...createdUpdated,
});

export const hero_banners = pgTable(
  'hero_banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    image_url: text('image_url').notNull(),
    mobile_image_url: text('mobile_image_url'),
    title: text('title'),
    subtitle: text('subtitle'),
    button_text: text('button_text'),
    button_link: text('button_link'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_hero_banners_is_active').on(table.is_active),
    sortOrderIdx: index('idx_hero_banners_sort_order').on(table.sort_order),
  })
);

export const trending_reels = pgTable(
  'trending_reels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    video_url: text('video_url').notNull(),
    thumbnail_url: text('thumbnail_url').notNull(),
    category: text('category'),
    caption: text('caption'),
    product_id: uuid('product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    product_name: text('product_name').notNull(),
    price: text('price').notNull(),
    price_amount: integer('price_amount'),
    link_url: text('link_url').notNull(),
    view_count: integer('view_count').default(0).notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_trending_reels_is_active').on(table.is_active),
    sortOrderIdx: index('idx_trending_reels_sort_order').on(table.sort_order),
  })
);

export const reel_collections = pgTable(
  'reel_collections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    handle: text('handle').notNull().unique(),
    subtitle: text('subtitle'),
    description: text('description'),
    hero_image_url: text('hero_image_url'),
    hero_video_url: text('hero_video_url'),
    cta_label: text('cta_label').default('Shop Collection').notNull(),
    cta_url: text('cta_url'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_reel_collections_is_active').on(table.is_active),
    handleIdx: index('idx_reel_collections_handle').on(table.handle),
    sortOrderIdx: index('idx_reel_collections_sort_order').on(table.sort_order),
  })
);

export const reel_collection_items = pgTable(
  'reel_collection_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collection_id: uuid('collection_id')
      .references(() => reel_collections.id, { onDelete: 'cascade' })
      .notNull(),
    reel_id: uuid('reel_id')
      .references(() => trending_reels.id, { onDelete: 'cascade' })
      .notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    collectionIdx: index('idx_reel_collection_items_collection').on(
      table.collection_id,
      table.sort_order
    ),
    reelIdx: index('idx_reel_collection_items_reel').on(table.reel_id),
  })
);

export const homepage_categories = pgTable(
  'homepage_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    category_id: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    image_url: text('image_url').notNull(),
    name: text('name').notNull(),
    link_url: text('link_url').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_homepage_categories_is_active').on(table.is_active),
    sortOrderIdx: index('idx_homepage_categories_sort_order').on(table.sort_order),
  })
);

export const homepage_banners = pgTable(
  'homepage_banners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    image_url: text('image_url').notNull(),
    headline: text('headline'),
    button_label: text('button_label'),
    button_url: text('button_url'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_homepage_banners_is_active').on(table.is_active),
    sortOrderIdx: index('idx_homepage_banners_sort_order').on(table.sort_order),
  })
);

export const category_circles = pgTable(
  'category_circles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    category_id: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    image_url: text('image_url').notNull(),
    label: text('label').notNull(),
    link_url: text('link_url').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_category_circles_is_active').on(table.is_active),
    sortOrderIdx: index('idx_category_circles_sort_order').on(table.sort_order),
  })
);

export const trust_items = pgTable(
  'trust_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    label: text('label').notNull(),
    sub: text('sub').notNull(),
    icon: text('icon').notNull().default('✦'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_trust_items_is_active').on(table.is_active),
    sortOrderIdx: index('idx_trust_items_sort_order').on(table.sort_order),
  })
);

export const featured_products = pgTable(
  'featured_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    section_key: text('section_key').default('spotlight').notNull(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    custom_image_url: text('custom_image_url'),
    badge_text: text('badge_text'),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sectionIdx: index('idx_featured_products_section_key').on(table.section_key),
    productIdx: index('idx_featured_products_product_id').on(table.product_id),
    activeIdx: index('idx_featured_products_is_active').on(table.is_active),
    sortOrderIdx: index('idx_featured_products_sort_order').on(table.sort_order),
  })
);

export const homepage_merchandising_slots = pgTable(
  'homepage_merchandising_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slot_key: text('slot_key').notNull(),
    eyebrow: text('eyebrow'),
    title: text('title').notNull(),
    copy: text('copy'),
    image_url: text('image_url'),
    mobile_image_url: text('mobile_image_url'),
    link_url: text('link_url'),
    linked_product_id: uuid('linked_product_id').references(() => products.id, {
      onDelete: 'set null',
    }),
    linked_collection_id: uuid('linked_collection_id').references(
      () => product_collections.id,
      { onDelete: 'set null' }
    ),
    linked_category_id: uuid('linked_category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    linked_tag_id: uuid('linked_tag_id').references(() => tags.id, {
      onDelete: 'set null',
    }),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slotKeyIdx: index('idx_homepage_merchandising_slots_slot_key').on(
      table.slot_key
    ),
    activeIdx: index('idx_homepage_merchandising_slots_is_active').on(
      table.is_active
    ),
    sortOrderIdx: index('idx_homepage_merchandising_slots_sort_order').on(
      table.sort_order
    ),
  })
);

export const homepage_social_posts = pgTable(
  'homepage_social_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    image_url: text('image_url').notNull(),
    alt_text: text('alt_text').notNull(),
    caption: text('caption'),
    destination_url: text('destination_url').notNull(),
    is_active: boolean('is_active').default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    activeIdx: index('idx_homepage_social_posts_is_active').on(table.is_active),
    sortOrderIdx: index('idx_homepage_social_posts_sort_order').on(table.sort_order),
  })
);

// --- BLOG & CONTENT ---
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  cover_image: text('cover_image'),
  author_id: uuid('author_id').references(() => users.id),
  status: text('status').default('draft'), // draft, published, archived
  published_at: timestamp('published_at'),
  seo_title: text('seo_title'),
  seo_description: text('seo_description'),
  seo_keywords: text('seo_keywords'),
  metadata: jsonb('metadata'),
  ...createdUpdated,
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.author_id],
    references: [users.id],
  }),
}));

export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(), // HTML content
  is_visible: boolean('is_visible').default(true),
  seo_title: text('seo_title'),
  seo_description: text('seo_description'),
  ...createdUpdated,
});

// --- TESTIMONIALS ---
export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  avatar_url: text('avatar_url'),
  rating: integer('rating').default(5),
  content: text('content').notNull(),
  is_active: boolean('is_active').default(true),
  display_order: integer('display_order').default(0),
  ...createdUpdated,
});

// --- NOTIFICATIONS ---
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: text('type').notNull(), // order, customer, system
    title: text('title').notNull(),
    message: text('message').notNull(),
    read: boolean('read').default(false),
    metadata: jsonb('metadata'), // store order_id, customer_id etc
    ...createdUpdated,
  },
  (table) => ({
    typeIdx: index('idx_notifications_type').on(table.type),
    readIdx: index('idx_notifications_read').on(table.read),
    createdAtIdx: index('idx_notifications_created_at').on(table.created_at),
  })
);

// --- WHATSAPP SETTINGS ---
export const whatsapp_settings = pgTable('whatsapp_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone_number_id: text('phone_number_id').notNull(),
  access_token: text('access_token').notNull(),
  business_account_id: text('business_account_id'),
  admin_phone: text('admin_phone').notNull(), // Where to send admin notifications
  notify_on_order: boolean('notify_on_order').default(true),
  notify_on_new_customer: boolean('notify_on_new_customer').default(false),
  is_active: boolean('is_active').default(false),
  ...createdUpdated,
});

// --- CART PERSISTENCE (Cart Abandonment Recovery) ---
export const saved_carts = pgTable(
  'saved_carts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customer_id: uuid('customer_id').references(() => customers.id, {
      onDelete: 'cascade',
    }),
    session_id: text('session_id'), // Guest carts ke liye
    items: jsonb('items').notNull().default('[]'), // CartItem[] JSON array
    metadata: jsonb('metadata'), // To track reminder stages, etc.
    recovery_sent: boolean('recovery_sent').default(false),
    recovery_sent_at: timestamp('recovery_sent_at'),
    ...createdUpdated,
  },
  (table) => ({
    customerIdx: index('idx_saved_carts_customer_id').on(table.customer_id),
    sessionIdx: index('idx_saved_carts_session_id').on(table.session_id),
    recoverySentIdx: index('idx_saved_carts_recovery_sent').on(table.recovery_sent),
    updatedAtIdx: index('idx_saved_carts_updated_at').on(table.updated_at),
  })
);

// --- BACK IN STOCK SUBSCRIPTIONS ---
export const back_in_stock_subscriptions = pgTable(
  'back_in_stock_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variant_id: uuid('variant_id').references(() => product_variants.id, {
      onDelete: 'cascade',
    }),
    email: text('email').notNull(),
    notified: boolean('notified').default(false),
    notified_at: timestamp('notified_at'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    productIdx: index('idx_bis_product_id').on(table.product_id),
    emailIdx: index('idx_bis_email').on(table.email),
    notifiedIdx: index('idx_bis_notified').on(table.notified),
  })
);

// --- WISHLISTS ---
export const wishlists = pgTable(
  'wishlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customer_id: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    product_id: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variant_id: uuid('variant_id').references(() => product_variants.id, {
      onDelete: 'set null',
    }),
    created_at: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.customer_id, t.product_id] }),
    customerIdx: index('idx_wishlists_customer_id').on(t.customer_id),
  })
);

// --- RETURNS & REFUNDS ---
export const returns = pgTable(
  'returns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    order_id: uuid('order_id')
      .references(() => orders.id, { onDelete: 'cascade' })
      .notNull(),
    customer_id: uuid('customer_id').references(() => customers.id),
    reason: text('reason').notNull(),
    // pending → approved → refunded | rejected
    status: text('status').default('pending'),
    refund_amount: integer('refund_amount').default(0), // in cents
    admin_notes: text('admin_notes'),
    ...createdUpdated,
  },
  (table) => ({
    orderIdx: index('idx_returns_order_id').on(table.order_id),
    statusIdx: index('idx_returns_status').on(table.status),
  })
);

export const return_items = pgTable(
  'return_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    return_id: uuid('return_id')
      .references(() => returns.id, { onDelete: 'cascade' })
      .notNull(),
    line_item_id: uuid('line_item_id').references(() => line_items.id),
    quantity: integer('quantity').notNull(),
    restock: boolean('restock').default(true), // auto-restock inventory?
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    returnIdx: index('idx_return_items_return_id').on(table.return_id),
  })
);

export const returnsRelations = relations(returns, ({ one, many }) => ({
  order: one(orders, {
    fields: [returns.order_id],
    references: [orders.id],
  }),
  customer: one(customers, {
    fields: [returns.customer_id],
    references: [customers.id],
  }),
  items: many(return_items),
}));

export const returnItemsRelations = relations(return_items, ({ one }) => ({
  return_request: one(returns, {
    fields: [return_items.return_id],
    references: [returns.id],
  }),
  line_item: one(line_items, {
    fields: [return_items.line_item_id],
    references: [line_items.id],
  }),
}));


// --- ADMIN AUDIT LOG (guide Section 7.3) ---
export const admin_audit_log = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    user_id: uuid('user_id').notNull(),
    user_role: text('user_role'),
    action: text('action').notNull(),
    entity_type: text('entity_type').notNull(),
    entity_id: uuid('entity_id'),
    old_value: jsonb('old_value'),
    new_value: jsonb('new_value'),
    ip_address: text('ip_address'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_audit_user').on(table.user_id),
    entityIdx: index('idx_audit_entity').on(table.entity_type, table.entity_id),
    createdIdx: index('idx_audit_created').on(table.created_at),
  })
);

export const security_events = pgTable(
  'security_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: text('source').notNull().default('backend'),
    severity: text('severity').notNull(),
    event: text('event').notNull(),
    ip_address: text('ip_address'),
    method: text('method'),
    path: text('path'),
    details: jsonb('details'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    createdIdx: index('idx_security_events_created').on(table.created_at),
    eventIdx: index('idx_security_events_event').on(table.event),
    ipIdx: index('idx_security_events_ip').on(table.ip_address),
  })
);

// --- REDIRECTS (guide Section 11.4) ---
export const redirects = pgTable(
  'redirects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    from_path: text('from_path').notNull().unique(),
    to_path: text('to_path').notNull(),
    status: integer('status').default(301),
    created_by: uuid('created_by'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    fromIdx: index('idx_redirects_from').on(table.from_path),
  })
);

export const order_status_history = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').references(() => orders.id).notNull(),
  from_status: text('from_status').notNull(),
  to_status: text('to_status').notNull(),
  changed_by: text('changed_by').notNull(),
  changed_by_id: text('changed_by_id'),
  note: text('note'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
