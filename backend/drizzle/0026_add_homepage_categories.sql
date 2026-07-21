CREATE TABLE IF NOT EXISTS "homepage_categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "image_url" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "link_url" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "sort_order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_homepage_categories_is_active" ON "homepage_categories" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_homepage_categories_sort_order" ON "homepage_categories" ("sort_order");
