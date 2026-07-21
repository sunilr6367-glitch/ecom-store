ALTER TABLE "homepage_categories"
  ADD COLUMN IF NOT EXISTS "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL;

ALTER TABLE "category_circles"
  ADD COLUMN IF NOT EXISTS "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL;

ALTER TABLE "featured_products"
  ADD COLUMN IF NOT EXISTS "section_key" text NOT NULL DEFAULT 'spotlight';

CREATE INDEX IF NOT EXISTS "idx_featured_products_section_key"
  ON "featured_products" ("section_key");
