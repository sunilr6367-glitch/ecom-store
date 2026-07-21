-- Migration: Collections table v2 upgrade
-- Adds: type, status, rule_type, cover_image_url, display_order,
--       show_in_megamenu, homepage_section, valid_from, valid_until,
--       seo_title, seo_desc, og_image_url

ALTER TABLE product_collections
  ADD COLUMN IF NOT EXISTS type VARCHAR(20)
    CHECK (type IN ('occasion','seasonal','price','fabric','gift','style')),
  ADD COLUMN IF NOT EXISTS rule_type VARCHAR(10) DEFAULT 'manual'
    CHECK (rule_type IN ('manual','auto')),
  ADD COLUMN IF NOT EXISTS rule_definition JSONB,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'draft'
    CHECK (status IN ('draft','active','archived')),
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_in_megamenu BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_section VARCHAR(50),
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS seo_desc VARCHAR(300),
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Migrate existing image → cover_image_url
UPDATE product_collections
  SET cover_image_url = image
  WHERE cover_image_url IS NULL AND image IS NOT NULL;

-- Existing collections: handle hai toh active treat karo
UPDATE product_collections
  SET status = 'active'
  WHERE status = 'draft' AND handle IS NOT NULL AND handle != '';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collections_status
  ON product_collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_type
  ON product_collections(type);
CREATE INDEX IF NOT EXISTS idx_collections_display_order
  ON product_collections(display_order);
CREATE INDEX IF NOT EXISTS idx_collections_megamenu
  ON product_collections(show_in_megamenu) WHERE show_in_megamenu = true;
