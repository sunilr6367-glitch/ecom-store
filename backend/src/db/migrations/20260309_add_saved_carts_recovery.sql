-- Add recovery tracking columns to saved_carts for abandoned cart feature
ALTER TABLE saved_carts
  ADD COLUMN IF NOT EXISTS recovery_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMP;

-- Add index for querying abandoned carts by recovery status
CREATE INDEX IF NOT EXISTS idx_saved_carts_recovery_sent
  ON saved_carts(recovery_sent);

-- Add index for filtering abandoned carts by last activity time
CREATE INDEX IF NOT EXISTS idx_saved_carts_updated_at
  ON saved_carts(updated_at);
