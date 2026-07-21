ALTER TABLE product_collections
  ADD COLUMN IF NOT EXISTS is_indexable boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS robots_policy text DEFAULT 'index,follow',
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS seasonal_flag text DEFAULT 'evergreen',
  ADD COLUMN IF NOT EXISTS faq_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS answer_capsule text;

ALTER TABLE product_collections
  ALTER COLUMN seasonal_flag TYPE text
  USING CASE
    WHEN seasonal_flag::text = 'true' THEN 'seasonal'
    WHEN seasonal_flag::text = 'false' THEN 'evergreen'
    WHEN seasonal_flag::text IN ('evergreen', 'seasonal', 'campaign') THEN seasonal_flag::text
    ELSE 'evergreen'
  END;

ALTER TABLE product_collections
  ALTER COLUMN seasonal_flag SET DEFAULT 'evergreen';

UPDATE product_collections
SET
  is_indexable = COALESCE(is_indexable, true),
  robots_policy = COALESCE(NULLIF(robots_policy, ''), 'index,follow'),
  seasonal_flag = CASE
    WHEN seasonal_flag IN ('evergreen', 'seasonal', 'campaign') THEN seasonal_flag
    WHEN type = 'seasonal' THEN 'seasonal'
    ELSE 'evergreen'
  END,
  faq_items = COALESCE(faq_items, '[]'::jsonb)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_collections_is_indexable
  ON product_collections(is_indexable);

CREATE INDEX IF NOT EXISTS idx_collections_seasonal_flag
  ON product_collections(seasonal_flag);
