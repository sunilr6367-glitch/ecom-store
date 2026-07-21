-- Missing columns migration for production Supabase DB
-- Run this in Supabase SQL Editor

-- Products table: missing columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_guide text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_instructions text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description text;

-- Product variants table: missing columns
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS compare_at_price integer;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS moq integer;

-- Testimonials table (if not already created by 20260216 migration)
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  avatar_url text,
  rating integer DEFAULT 5,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  deleted_at timestamp
);
