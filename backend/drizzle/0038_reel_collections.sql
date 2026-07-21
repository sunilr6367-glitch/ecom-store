CREATE TABLE IF NOT EXISTS "reel_collections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "handle" text NOT NULL UNIQUE,
  "subtitle" text,
  "description" text,
  "hero_image_url" text,
  "hero_video_url" text,
  "cta_label" text DEFAULT 'Shop Collection' NOT NULL,
  "cta_url" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reel_collection_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "collection_id" uuid NOT NULL REFERENCES "reel_collections"("id") ON DELETE cascade,
  "reel_id" uuid NOT NULL REFERENCES "trending_reels"("id") ON DELETE cascade,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "reel_collection_items_collection_reel_unique" UNIQUE ("collection_id", "reel_id")
);

CREATE INDEX IF NOT EXISTS "idx_reel_collections_is_active" ON "reel_collections" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_reel_collections_handle" ON "reel_collections" ("handle");
CREATE INDEX IF NOT EXISTS "idx_reel_collections_sort_order" ON "reel_collections" ("sort_order");
CREATE INDEX IF NOT EXISTS "idx_reel_collection_items_collection" ON "reel_collection_items" ("collection_id", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_reel_collection_items_reel" ON "reel_collection_items" ("reel_id");
