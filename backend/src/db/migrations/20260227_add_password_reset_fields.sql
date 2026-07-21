-- Add password reset fields to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS reset_token text,
ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp,
ADD COLUMN IF NOT EXISTS reset_attempts integer DEFAULT 0;

-- Add index for reset_token
CREATE INDEX IF NOT EXISTS idx_customers_reset_token ON customers(reset_token);
