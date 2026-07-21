-- Migration: Auto-draft trigger — collection < 3 active products hone par draft ho
-- Guide Section 5.4

CREATE OR REPLACE FUNCTION check_collection_product_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_collections
  SET status = 'draft'
  WHERE id = OLD.collection_id
    AND status = 'active'
    AND (
      SELECT COUNT(*)
      FROM collection_products cp
      JOIN products p ON p.id = cp.product_id
      WHERE cp.collection_id = OLD.collection_id
        AND p.status = 'published'
    ) < 3;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collection_count_check ON collection_products;
CREATE TRIGGER trg_collection_count_check
  AFTER DELETE ON collection_products
  FOR EACH ROW EXECUTE FUNCTION check_collection_product_count();

-- Also: agar product status change ho (published → draft), check karo
CREATE OR REPLACE FUNCTION check_collection_count_on_product_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes away from published
  IF OLD.status = 'published' AND NEW.status != 'published' THEN
    UPDATE product_collections pc
    SET status = 'draft'
    FROM collection_products cp
    WHERE cp.collection_id = pc.id
      AND cp.product_id = NEW.id
      AND pc.status = 'active'
      AND (
        SELECT COUNT(*)
        FROM collection_products cp2
        JOIN products p2 ON p2.id = cp2.product_id
        WHERE cp2.collection_id = pc.id
          AND p2.status = 'published'
      ) < 3;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_status_collection_check ON products;
CREATE TRIGGER trg_product_status_collection_check
  AFTER UPDATE OF status ON products
  FOR EACH ROW EXECUTE FUNCTION check_collection_count_on_product_status();
