CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS verified_purchase boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

ALTER TABLE product_media_seo
  ADD COLUMN IF NOT EXISTS cloudinary_public_id text,
  ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image';

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

CREATE TABLE IF NOT EXISTS artisans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  craft_specialty text,
  location text,
  image_url text,
  knows_about jsonb DEFAULT '[]'::jsonb,
  has_occupation text DEFAULT 'Textile artisan',
  same_as jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS product_artisans (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE cascade,
  artisan_id uuid NOT NULL REFERENCES artisans(id) ON DELETE cascade,
  role text DEFAULT 'creator',
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (product_id, artisan_id)
);

CREATE TABLE IF NOT EXISTS hreflang_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text,
  canonical_url text NOT NULL,
  locale text NOT NULL,
  localized_url text NOT NULL,
  is_default boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS market_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  locale text NOT NULL,
  market_code text NOT NULL,
  shipping_title text,
  shipping_content text,
  returns_title text,
  returns_content text,
  currency_code text,
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS gsc_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamp NOT NULL,
  page text NOT NULL,
  query text,
  locale text DEFAULT 'en',
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr numeric DEFAULT 0,
  position numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competitor_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  competitor_url text,
  locale text DEFAULT 'en',
  search_volume integer,
  difficulty integer,
  priority integer DEFAULT 50,
  status text DEFAULT 'candidate',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  deleted_at timestamp
);

CREATE TABLE IF NOT EXISTS merchant_feed_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  status text DEFAULT 'ok',
  product_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  last_generated_at timestamp DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_embeddings'
      AND column_name = 'embedding'
      AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE product_embeddings
      RENAME COLUMN embedding TO embedding_json_backup;
    ALTER TABLE product_embeddings
      ADD COLUMN embedding vector(1536);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_artisans_slug ON artisans(slug);
CREATE INDEX IF NOT EXISTS idx_artisans_status ON artisans(status);
CREATE INDEX IF NOT EXISTS idx_product_artisans_product ON product_artisans(product_id);
CREATE INDEX IF NOT EXISTS idx_product_artisans_artisan ON product_artisans(artisan_id);
CREATE INDEX IF NOT EXISTS idx_hreflang_groups_entity ON hreflang_groups(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hreflang_groups_locale ON hreflang_groups(locale);
CREATE INDEX IF NOT EXISTS idx_market_policies_market ON market_policies(locale, market_code);
CREATE INDEX IF NOT EXISTS idx_market_policies_status ON market_policies(status);
CREATE INDEX IF NOT EXISTS idx_gsc_performance_page ON gsc_performance(page);
CREATE INDEX IF NOT EXISTS idx_gsc_performance_date ON gsc_performance(date);
CREATE INDEX IF NOT EXISTS idx_competitor_keywords_keyword ON competitor_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_competitor_keywords_status ON competitor_keywords(status);
CREATE INDEX IF NOT EXISTS idx_merchant_feed_health_channel ON merchant_feed_health(channel);
CREATE INDEX IF NOT EXISTS idx_product_embeddings_vector
  ON product_embeddings USING ivfflat (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

INSERT INTO artisans (name, slug, bio, craft_specialty, location, knows_about, has_occupation)
VALUES (
  'Jaipur Block Print Artisan Collective',
  'jaipur-block-print-artisan',
  'A Jaipur-based artisan collective specializing in block print, Kantha-inspired quilting, and handmade cotton accessories.',
  'Block print and quilted textile craft',
  'Jaipur, Rajasthan, India',
  '["Block printing","Kantha quilting","Cotton textiles","Jaipur craft"]'::jsonb,
  'Textile artisan collective'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO market_policies (locale, market_code, shipping_title, shipping_content, returns_title, returns_content, currency_code)
VALUES
  ('en-in', 'IN', 'India Shipping', 'Tracked India shipping with free shipping thresholds shown at checkout.', 'India Returns', 'Eligible unworn items can be returned within 30 days.', 'INR'),
  ('en-us', 'US', 'US Shipping', 'Tracked international shipping from Jaipur to the United States.', 'US Returns', 'Eligible unworn items can be returned within 30 days by mail.', 'USD'),
  ('en-gb', 'GB', 'UK Shipping', 'Tracked international shipping from Jaipur to the United Kingdom.', 'UK Returns', 'Eligible unworn items can be returned within 30 days by mail.', 'GBP'),
  ('en-au', 'AU', 'Australia Shipping', 'Tracked international shipping from Jaipur to Australia.', 'Australia Returns', 'Eligible unworn items can be returned within 30 days by mail.', 'AUD'),
  ('en-eu', 'EU', 'Europe Shipping', 'Tracked international shipping from Jaipur to Europe.', 'Europe Returns', 'Eligible unworn items can be returned within 30 days by mail.', 'EUR')
ON CONFLICT DO NOTHING;
