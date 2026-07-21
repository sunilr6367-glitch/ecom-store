-- Migration: Create collection_products M2M junction table
-- Purpose: Ek product multiple collections mein ho sake (guide Section 4.7)
-- Current: products.collection_id = single collection (one-to-many)
-- New: collection_products junction = many-to-many

CREATE TABLE IF NOT EXISTS collection_products (
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES product_collections(id) ON DELETE CASCADE,
  position      INTEGER DEFAULT 0,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, collection_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_collection
  ON collection_products(collection_id, position);
CREATE INDEX IF NOT EXISTS idx_cp_product
  ON collection_products(product_id);

-- Migrate existing data from products.collection_id → junction table
INSERT INTO collection_products (product_id, collection_id, position)
  SELECT
    p.id,
    p.collection_id,
    ROW_NUMBER() OVER (PARTITION BY p.collection_id ORDER BY p.created_at) - 1
  FROM products p
  WHERE p.collection_id IS NOT NULL
ON CONFLICT (product_id, collection_id) DO NOTHING;
