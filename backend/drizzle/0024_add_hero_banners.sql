CREATE TABLE IF NOT EXISTS "hero_banners" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "image_url" TEXT NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "button_text" TEXT,
  "button_link" TEXT,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "sort_order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hero_banners_is_active" ON "hero_banners" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hero_banners_sort_order" ON "hero_banners" ("sort_order");
