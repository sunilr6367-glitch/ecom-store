ALTER TABLE "hero_banners"
  ADD COLUMN IF NOT EXISTS "mobile_image_url" text;

ALTER TABLE "trending_reels"
  ADD COLUMN IF NOT EXISTS "category" text,
  ADD COLUMN IF NOT EXISTS "caption" text,
  ADD COLUMN IF NOT EXISTS "product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "homepage_merchandising_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slot_key" text NOT NULL,
  "eyebrow" text,
  "title" text NOT NULL,
  "copy" text,
  "image_url" text,
  "mobile_image_url" text,
  "link_url" text,
  "linked_product_id" uuid REFERENCES "products"("id") ON DELETE SET NULL,
  "linked_collection_id" uuid REFERENCES "product_collections"("id") ON DELETE SET NULL,
  "linked_category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "linked_tag_id" uuid REFERENCES "tags"("id") ON DELETE SET NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_homepage_merchandising_slots_slot_key"
  ON "homepage_merchandising_slots" ("slot_key");

CREATE INDEX IF NOT EXISTS "idx_homepage_merchandising_slots_is_active"
  ON "homepage_merchandising_slots" ("is_active");

CREATE INDEX IF NOT EXISTS "idx_homepage_merchandising_slots_sort_order"
  ON "homepage_merchandising_slots" ("sort_order");
