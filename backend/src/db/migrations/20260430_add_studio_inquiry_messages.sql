-- Migration: Add threaded chat messages for studio inquiries
ALTER TABLE studio_inquiries
  ADD COLUMN IF NOT EXISTS conversation_token TEXT,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS unread_by_admin BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unread_by_customer BOOLEAN NOT NULL DEFAULT false;

UPDATE studio_inquiries
SET conversation_token = gen_random_uuid()::text
WHERE conversation_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_inquiries_conversation_token_unique
  ON studio_inquiries (conversation_token);

CREATE INDEX IF NOT EXISTS idx_studio_inquiries_conversation_token
  ON studio_inquiries (conversation_token);

CREATE TABLE IF NOT EXISTS studio_inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES studio_inquiries(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_inquiry_messages_inquiry_id
  ON studio_inquiry_messages (inquiry_id);

CREATE INDEX IF NOT EXISTS idx_studio_inquiry_messages_created_at
  ON studio_inquiry_messages (created_at);

INSERT INTO studio_inquiry_messages (inquiry_id, sender_type, sender_name, sender_email, message, created_at)
SELECT id, 'customer', customer_name, email, message, COALESCE(created_at, NOW())
FROM studio_inquiries
WHERE NOT EXISTS (
  SELECT 1
  FROM studio_inquiry_messages
  WHERE studio_inquiry_messages.inquiry_id = studio_inquiries.id
);
