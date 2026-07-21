-- Add wholesale_price field to product_variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS wholesale_price integer;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_wholesale_price ON product_variants(wholesale_price) WHERE wholesale_price IS NOT NULL;
