-- Migration: SEO fields for categories
-- Guide Section 2.5 + Section 11.1

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200),
  ADD COLUMN IF NOT EXISTS seo_desc  VARCHAR(300),
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

-- Auto-populate seo_title from name (format from guide Section 11.1)
UPDATE categories
  SET seo_title = name || ' — Handmade Indian Fashion | Odhvica'
  WHERE seo_title IS NULL;
