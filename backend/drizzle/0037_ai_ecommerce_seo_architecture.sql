CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS "product_seo" (
  "product_id" uuid PRIMARY KEY REFERENCES "products"("id") ON DELETE cascade,
  "seo_title" text,
  "meta_description" text,
  "canonical_url" text,
  "robots_index" boolean DEFAULT true,
  "robots_follow" boolean DEFAULT true,
  "og_title" text,
  "og_description" text,
  "og_image_url" text,
  "twitter_card" text DEFAULT 'summary_large_image',
  "schema_overrides" jsonb DEFAULT '{}'::jsonb,
  "localized_metadata" jsonb DEFAULT '{}'::jsonb,
  "hreflang_group_id" text,
  "seo_score" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "type" text DEFAULT 'text',
  "facet_enabled" boolean DEFAULT true,
  "seo_enabled" boolean DEFAULT true,
  "merchant_mapping" text,
  "display_order" integer DEFAULT 0,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "attribute_values" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attribute_id" uuid NOT NULL REFERENCES "product_attributes"("id") ON DELETE cascade,
  "slug" text NOT NULL,
  "label" text NOT NULL,
  "synonyms" jsonb DEFAULT '[]'::jsonb,
  "locale_labels" jsonb DEFAULT '{}'::jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "product_attribute_values" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "attribute_id" uuid NOT NULL REFERENCES "product_attributes"("id") ON DELETE cascade,
  "value_id" uuid REFERENCES "attribute_values"("id") ON DELETE set null,
  "raw_value" text,
  "source" text DEFAULT 'admin',
  "confidence" integer DEFAULT 100,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "product_discovery" (
  "product_id" uuid PRIMARY KEY REFERENCES "products"("id") ON DELETE cascade,
  "primary_keyword" text,
  "secondary_keywords" jsonb DEFAULT '[]'::jsonb,
  "long_tail_keywords" jsonb DEFAULT '[]'::jsonb,
  "search_intents" jsonb DEFAULT '[]'::jsonb,
  "semantic_entities" jsonb DEFAULT '[]'::jsonb,
  "negative_keywords" jsonb DEFAULT '[]'::jsonb,
  "product_document" text,
  "document_hash" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "product_variant_merchant" (
  "variant_id" uuid PRIMARY KEY REFERENCES "product_variants"("id") ON DELETE cascade,
  "gtin" text,
  "mpn" text,
  "item_group_id" text,
  "color" text,
  "size" text,
  "size_system" text,
  "size_type" text,
  "gender" text,
  "age_group" text,
  "condition" text DEFAULT 'new',
  "google_product_category" text,
  "material" text,
  "pattern" text,
  "shipping_weight" integer,
  "feed_enabled" boolean DEFAULT false,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "product_media_seo" (
  "image_id" uuid PRIMARY KEY REFERENCES "product_images"("id") ON DELETE cascade,
  "alt_text" text,
  "image_role" text,
  "view_type" text,
  "color" text,
  "seo_filename" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "seo_landing_pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "meta_description" text,
  "intro_content" text,
  "outro_content" text,
  "rule_definition" jsonb DEFAULT '{}'::jsonb,
  "canonical_url" text,
  "robots_index" boolean DEFAULT true,
  "robots_follow" boolean DEFAULT true,
  "hreflang_group_id" text,
  "status" text DEFAULT 'draft',
  "priority" integer DEFAULT 50,
  "localized_metadata" jsonb DEFAULT '{}'::jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "search_synonyms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "locale" text DEFAULT 'en',
  "term" text NOT NULL,
  "normalized_term" text NOT NULL,
  "synonyms" jsonb DEFAULT '[]'::jsonb,
  "boost" integer DEFAULT 1,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "search_query_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "query" text NOT NULL,
  "normalized_query" text,
  "locale" text DEFAULT 'en',
  "result_count" integer DEFAULT 0,
  "clicked_product_id" uuid REFERENCES "products"("id") ON DELETE set null,
  "source" text DEFAULT 'storefront',
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "product_embeddings" (
  "product_id" uuid PRIMARY KEY REFERENCES "products"("id") ON DELETE cascade,
  "locale" text DEFAULT 'en',
  "source_hash" text,
  "document" text,
  "embedding" jsonb DEFAULT '[]'::jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_product_seo_score" ON "product_seo" ("seo_score");
CREATE INDEX IF NOT EXISTS "idx_product_seo_robots" ON "product_seo" ("robots_index", "robots_follow");
CREATE INDEX IF NOT EXISTS "idx_product_attributes_code" ON "product_attributes" ("code");
CREATE INDEX IF NOT EXISTS "idx_product_attributes_display" ON "product_attributes" ("display_order");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_attribute_values_unique_attr_slug" ON "attribute_values" ("attribute_id", "slug");
CREATE INDEX IF NOT EXISTS "idx_attribute_values_label" ON "attribute_values" ("label");
CREATE INDEX IF NOT EXISTS "idx_product_attribute_values_product" ON "product_attribute_values" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_product_attribute_values_attribute" ON "product_attribute_values" ("attribute_id");
CREATE INDEX IF NOT EXISTS "idx_product_attribute_values_value" ON "product_attribute_values" ("value_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_product_attribute_values_unique_value" ON "product_attribute_values" ("product_id", "attribute_id", "value_id") WHERE "value_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_product_discovery_primary_keyword" ON "product_discovery" ("primary_keyword");
CREATE INDEX IF NOT EXISTS "idx_product_discovery_document_hash" ON "product_discovery" ("document_hash");
CREATE INDEX IF NOT EXISTS "idx_product_variant_merchant_item_group" ON "product_variant_merchant" ("item_group_id");
CREATE INDEX IF NOT EXISTS "idx_product_variant_merchant_feed" ON "product_variant_merchant" ("feed_enabled");
CREATE INDEX IF NOT EXISTS "idx_product_media_seo_role" ON "product_media_seo" ("image_role");
CREATE INDEX IF NOT EXISTS "idx_seo_landing_pages_slug" ON "seo_landing_pages" ("slug");
CREATE INDEX IF NOT EXISTS "idx_seo_landing_pages_status" ON "seo_landing_pages" ("status");
CREATE INDEX IF NOT EXISTS "idx_seo_landing_pages_indexable" ON "seo_landing_pages" ("status", "robots_index");
CREATE INDEX IF NOT EXISTS "idx_search_synonyms_term" ON "search_synonyms" ("locale", "normalized_term");
CREATE INDEX IF NOT EXISTS "idx_search_query_logs_query" ON "search_query_logs" ("normalized_query");
CREATE INDEX IF NOT EXISTS "idx_search_query_logs_zero_result" ON "search_query_logs" ("result_count");
CREATE INDEX IF NOT EXISTS "idx_search_query_logs_created" ON "search_query_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_product_embeddings_locale" ON "product_embeddings" ("locale");
CREATE INDEX IF NOT EXISTS "idx_product_embeddings_hash" ON "product_embeddings" ("source_hash");
CREATE INDEX IF NOT EXISTS "idx_products_title_trgm" ON "products" USING gin (lower("title") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_products_description_trgm" ON "products" USING gin (lower(coalesce("description", '')) gin_trgm_ops);

INSERT INTO "product_attributes" ("code", "label", "type", "facet_enabled", "seo_enabled", "merchant_mapping", "display_order", "metadata")
VALUES
  ('fabric', 'Fabric', 'select', true, true, 'material', 10, '{"required_for_publish":true}'::jsonb),
  ('material', 'Material', 'select', true, true, 'material', 20, '{}'::jsonb),
  ('technique', 'Technique', 'select', true, true, 'pattern', 30, '{}'::jsonb),
  ('occasion', 'Occasion', 'multi_select', true, true, null, 40, '{}'::jsonb),
  ('style', 'Style', 'multi_select', true, true, null, 50, '{}'::jsonb),
  ('sleeve', 'Sleeve', 'select', true, true, null, 60, '{}'::jsonb),
  ('fit', 'Fit', 'select', true, true, null, 70, '{}'::jsonb),
  ('pattern', 'Pattern', 'select', true, true, 'pattern', 80, '{}'::jsonb),
  ('color', 'Color', 'select', true, true, 'color', 90, '{}'::jsonb),
  ('region', 'Artisan Region', 'select', true, true, 'origin_country', 100, '{}'::jsonb),
  ('artisan_type', 'Artisan Type', 'select', true, true, null, 110, '{}'::jsonb)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "product_seo" ("product_id", "seo_title", "meta_description", "canonical_url", "robots_index", "robots_follow", "seo_score")
SELECT
  p."id",
  p."seo_title",
  p."seo_description",
  '/products/' || p."handle",
  true,
  true,
  CASE
    WHEN p."seo_title" IS NOT NULL AND p."seo_description" IS NOT NULL THEN 60
    WHEN p."seo_title" IS NOT NULL OR p."seo_description" IS NOT NULL THEN 40
    ELSE 20
  END
FROM "products" p
ON CONFLICT ("product_id") DO NOTHING;

INSERT INTO "product_discovery" ("product_id", "primary_keyword", "semantic_entities", "product_document")
SELECT
  p."id",
  coalesce(nullif(p."seo_title", ''), p."title"),
  '["Jaipur","handcrafted","artisan-made","slow fashion"]'::jsonb,
  trim(concat_ws(' ', p."title", p."subtitle", p."description", p."material", p."seo_title", p."seo_description"))
FROM "products" p
ON CONFLICT ("product_id") DO NOTHING;

INSERT INTO "attribute_values" ("attribute_id", "slug", "label", "synonyms")
SELECT DISTINCT
  pa."id",
  lower(regexp_replace(trim(p."material"), '[^a-zA-Z0-9]+', '-', 'g')),
  trim(p."material"),
  '[]'::jsonb
FROM "products" p
JOIN "product_attributes" pa ON pa."code" = 'fabric'
WHERE p."material" IS NOT NULL AND trim(p."material") <> ''
ON CONFLICT DO NOTHING;

INSERT INTO "product_attribute_values" ("product_id", "attribute_id", "value_id", "raw_value", "source", "confidence")
SELECT
  p."id",
  pa."id",
  av."id",
  p."material",
  'legacy_material',
  80
FROM "products" p
JOIN "product_attributes" pa ON pa."code" = 'fabric'
JOIN "attribute_values" av
  ON av."attribute_id" = pa."id"
  AND av."slug" = lower(regexp_replace(trim(p."material"), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE p."material" IS NOT NULL AND trim(p."material") <> ''
ON CONFLICT DO NOTHING;

INSERT INTO "search_synonyms" ("locale", "term", "normalized_term", "synonyms", "boost")
VALUES
  ('en', 'block print', 'block print', '["blockprint","bagru print","sanganeri print","hand block print"]'::jsonb, 3),
  ('en', 'boho', 'boho', '["bohemian","boho chic","festival style"]'::jsonb, 2),
  ('en', 'kurti', 'kurti', '["kurta","tunic","indian top"]'::jsonb, 2),
  ('en', 'kantha', 'kantha', '["kantha stitch","kantha embroidery","hand stitched"]'::jsonb, 3),
  ('en', 'cotton', 'cotton', '["mulmul","voile","handloom cotton"]'::jsonb, 2),
  ('en', 'jaipur', 'jaipur', '["rajasthan","sanganer","artisan made"]'::jsonb, 2)
ON CONFLICT DO NOTHING;
