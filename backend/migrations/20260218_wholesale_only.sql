-- Add is_wholesale_only flag to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_wholesale_only boolean DEFAULT false;

-- Create index for faster lookups of wholesale-only products
CREATE INDEX IF NOT EXISTS idx_products_wholesale_only ON products(is_wholesale_only) WHERE is_wholesale_only = true;
