-- Migration: Add countries column to regions table
-- This allows storing associated country ISO codes directly in the region

ALTER TABLE "regions" ADD COLUMN IF NOT EXISTS "countries" jsonb;

-- Comment explaining the column
COMMENT ON COLUMN "regions"."countries" IS 'JSON array of country ISO codes associated with this region, e.g., ["IN", "US", "GB"]'
