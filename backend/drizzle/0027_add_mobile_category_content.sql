CREATE TABLE IF NOT EXISTS "homepage_banners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "image_url" text NOT NULL,
  "headline" text,
  "button_label" text,
  "button_url" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_homepage_banners_is_active"
  ON "homepage_banners" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_homepage_banners_sort_order"
  ON "homepage_banners" ("sort_order");

CREATE TABLE IF NOT EXISTS "category_circles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "image_url" text NOT NULL,
  "label" text NOT NULL,
  "link_url" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_category_circles_is_active"
  ON "category_circles" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_category_circles_sort_order"
  ON "category_circles" ("sort_order");

CREATE TABLE IF NOT EXISTS "featured_products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "custom_image_url" text,
  "badge_text" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_featured_products_product_id"
  ON "featured_products" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_featured_products_is_active"
  ON "featured_products" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_featured_products_sort_order"
  ON "featured_products" ("sort_order");
