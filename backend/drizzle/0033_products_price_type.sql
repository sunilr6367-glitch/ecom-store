-- Migration: Add price_type to products table
-- Guide Section 4.3: 'fixed' | 'on_request'

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS price_type VARCHAR(15) DEFAULT 'fixed'
    CHECK (price_type IN ('fixed', 'on_request'));

-- All existing products default to fixed
UPDATE products SET price_type = 'fixed' WHERE price_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_price_type
  ON products(price_type);
