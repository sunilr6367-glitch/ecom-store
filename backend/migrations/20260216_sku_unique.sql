-- Migration: Add unique constraint to product_variants.sku
-- Only add if sku is not null and not already unique
DO $$ 
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_variants_sku_unique'
    ) THEN
        ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_sku_unique" UNIQUE ("sku");
    END IF;
END $$;
