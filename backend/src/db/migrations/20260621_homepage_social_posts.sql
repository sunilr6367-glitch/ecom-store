CREATE TABLE IF NOT EXISTS homepage_social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL,
  caption text,
  destination_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homepage_social_posts_is_active
  ON homepage_social_posts (is_active);

CREATE INDEX IF NOT EXISTS idx_homepage_social_posts_sort_order
  ON homepage_social_posts (sort_order);
