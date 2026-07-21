-- Migration: Add images column to product_reviews table
-- Created: 2026-02-18

-- Add images JSONB column to store array of image URLs
ALTER TABLE product_reviews 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Create index for efficient queries on reviews with images
CREATE INDEX IF NOT EXISTS idx_product_reviews_images 
ON product_reviews USING gin(images) 
WHERE jsonb_array_length(images) > 0;

-- Create index for fetching reviews by product with images
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id_images 
ON product_reviews(product_id, created_at) 
WHERE jsonb_array_length(images) > 0;

COMMENT ON COLUMN product_reviews.images IS 'Array of image URLs uploaded with the review (max 5 images)';
