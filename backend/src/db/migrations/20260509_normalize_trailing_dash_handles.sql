WITH collection_candidates AS (
  SELECT
    id,
    handle AS old_handle,
    regexp_replace(handle, '-+$', '') AS new_handle
  FROM product_collections
  WHERE handle ~ '-+$'
),
safe_collection_candidates AS (
  SELECT candidate.*
  FROM collection_candidates candidate
  WHERE candidate.new_handle <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM product_collections existing
      WHERE existing.handle = candidate.new_handle
        AND existing.id <> candidate.id
    )
)
INSERT INTO redirects (from_path, to_path, status)
SELECT
  '/collections/' || old_handle,
  '/collections/' || new_handle,
  301
FROM safe_collection_candidates
ON CONFLICT (from_path) DO NOTHING;

WITH collection_candidates AS (
  SELECT
    id,
    regexp_replace(handle, '-+$', '') AS new_handle
  FROM product_collections
  WHERE handle ~ '-+$'
)
UPDATE product_collections collection
SET handle = candidate.new_handle,
    updated_at = NOW()
FROM collection_candidates candidate
WHERE collection.id = candidate.id
  AND candidate.new_handle <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM product_collections existing
    WHERE existing.handle = candidate.new_handle
      AND existing.id <> collection.id
  );

WITH product_candidates AS (
  SELECT
    id,
    handle AS old_handle,
    regexp_replace(handle, '-+$', '') AS new_handle
  FROM products
  WHERE handle ~ '-+$'
),
safe_product_candidates AS (
  SELECT candidate.*
  FROM product_candidates candidate
  WHERE candidate.new_handle <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM products existing
      WHERE existing.handle = candidate.new_handle
        AND existing.id <> candidate.id
    )
)
INSERT INTO redirects (from_path, to_path, status)
SELECT
  '/products/' || old_handle,
  '/products/' || new_handle,
  301
FROM safe_product_candidates
ON CONFLICT (from_path) DO NOTHING;

WITH product_candidates AS (
  SELECT
    id,
    regexp_replace(handle, '-+$', '') AS new_handle
  FROM products
  WHERE handle ~ '-+$'
)
UPDATE products product
SET handle = candidate.new_handle,
    updated_at = NOW()
FROM product_candidates candidate
WHERE product.id = candidate.id
  AND candidate.new_handle <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM products existing
    WHERE existing.handle = candidate.new_handle
      AND existing.id <> product.id
  );

WITH category_candidates AS (
  SELECT
    id,
    slug AS old_slug,
    regexp_replace(slug, '-+$', '') AS new_slug
  FROM categories
  WHERE slug ~ '-+$'
),
safe_category_candidates AS (
  SELECT candidate.*
  FROM category_candidates candidate
  WHERE candidate.new_slug <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM categories existing
      WHERE existing.slug = candidate.new_slug
        AND existing.id <> candidate.id
    )
)
INSERT INTO redirects (from_path, to_path, status)
SELECT
  '/collections/' || old_slug,
  '/collections/' || new_slug,
  301
FROM safe_category_candidates
ON CONFLICT (from_path) DO NOTHING;

WITH category_candidates AS (
  SELECT
    id,
    regexp_replace(slug, '-+$', '') AS new_slug
  FROM categories
  WHERE slug ~ '-+$'
)
UPDATE categories category
SET slug = candidate.new_slug,
    updated_at = NOW()
FROM category_candidates candidate
WHERE category.id = candidate.id
  AND candidate.new_slug <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM categories existing
    WHERE existing.slug = candidate.new_slug
      AND existing.id <> category.id
  );
