ALTER TABLE trending_reels
ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;
