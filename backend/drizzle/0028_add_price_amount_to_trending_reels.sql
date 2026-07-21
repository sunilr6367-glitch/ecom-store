-- Add price_amount (INR paise) to trending_reels for currency conversion
ALTER TABLE trending_reels ADD COLUMN IF NOT EXISTS price_amount integer CHECK (price_amount >= 0);
