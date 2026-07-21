-- Migration: Add trust_items table for "As Seen On" section admin management
CREATE TABLE IF NOT EXISTS trust_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  sub TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✦',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_items_is_active ON trust_items (is_active);
CREATE INDEX IF NOT EXISTS idx_trust_items_sort_order ON trust_items (sort_order);

-- Seed default trust items
INSERT INTO trust_items (label, sub, icon, is_active, sort_order) VALUES
  ('Handmade in India', 'Every stitch by hand', '✦', true, 0),
  ('Ships Worldwide', 'USA · UK · EU · AU', '✦', true, 1),
  ('Ethically Made', 'Fair wages, always', '✦', true, 2),
  ('500+ Happy Customers', 'Verified reviews', '✦', true, 3),
  ('Secure Checkout', 'Visa · PayPal · Apple Pay', '✦', true, 4);
