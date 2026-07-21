-- Add header management and ordering fields to categories table
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "display_order" INTEGER DEFAULT 0;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "show_in_header" BOOLEAN DEFAULT true;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "header_image_url" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "emoji" TEXT;

-- Create indexes for sorting and filtering
CREATE INDEX IF NOT EXISTS "idx_categories_display_order" ON "categories"("display_order");
CREATE INDEX IF NOT EXISTS "idx_categories_show_in_header" ON "categories"("show_in_header");
