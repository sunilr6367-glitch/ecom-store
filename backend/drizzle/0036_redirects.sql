-- Migration: Redirects table for URL management
-- Guide Section 11.4 + Section 15.3

CREATE TABLE IF NOT EXISTS redirects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path  TEXT NOT NULL UNIQUE,
  to_path    TEXT NOT NULL,
  status     INTEGER DEFAULT 301 CHECK (status IN (301, 302)),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redirects_from
  ON redirects(from_path);

-- Seed: Footer broken links (guide Section 15.3)
INSERT INTO redirects (from_path, to_path) VALUES
  ('/collections/kantha-quilts',   '/collections/kantha-essentials'),
  ('/collections/block-print',     '/collections/block-print-edit'),
  ('/collections/dupattas-stoles', '/categories/scarves-wraps'),
  ('/collections/gifts',           '/collections/gifts-under-2000'),
  ('/collections/shawls',          '/categories/scarves-wraps'),
  ('/collections/kurtis',          '/categories/suits-kurtas'),
  ('/collections/accessories',     '/categories/accessories')
ON CONFLICT (from_path) DO NOTHING;
