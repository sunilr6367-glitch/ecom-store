CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.material, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.handle, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;

CREATE TRIGGER trg_products_search_vector
BEFORE INSERT OR UPDATE OF title, subtitle, description, material, handle
ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_search_vector();

UPDATE products
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(material, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(handle, '')), 'D')
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_products_title_trgm
  ON products USING gin (lower(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_handle_trgm
  ON products USING gin (lower(handle) gin_trgm_ops);
