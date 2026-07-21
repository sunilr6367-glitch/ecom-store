CREATE TABLE IF NOT EXISTS "trending_reels" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "video_url" TEXT NOT NULL,
  "thumbnail_url" TEXT NOT NULL,
  "product_name" TEXT NOT NULL,
  "price" TEXT NOT NULL,
  "link_url" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true NOT NULL,
  "sort_order" INTEGER DEFAULT 0 NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trending_reels_is_active" ON "trending_reels" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trending_reels_sort_order" ON "trending_reels" ("sort_order");
