DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM returns
    GROUP BY order_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one return per order: duplicate return rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM money_amounts
    WHERE region_id IS NOT NULL
    GROUP BY variant_id, region_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce regional price uniqueness: duplicate rows exist';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_returns_order_id
  ON returns (order_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_money_amounts_variant_region
  ON money_amounts (variant_id, region_id)
  WHERE region_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'return_items_quantity_positive'
  ) THEN
    ALTER TABLE return_items
      ADD CONSTRAINT return_items_quantity_positive CHECK (quantity > 0);
  END IF;
END $$;
