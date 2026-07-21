-- Phase 4: Returns & Refunds tables
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS "returns" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "customer_id" uuid REFERENCES "customers"("id"),
  "reason" text NOT NULL,
  "status" text DEFAULT 'pending',
  "refund_amount" integer DEFAULT 0,
  "admin_notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  "deleted_at" timestamp
);

CREATE TABLE IF NOT EXISTS "return_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "return_id" uuid NOT NULL REFERENCES "returns"("id") ON DELETE CASCADE,
  "line_item_id" uuid REFERENCES "line_items"("id"),
  "quantity" integer NOT NULL,
  "restock" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_returns_order_id" ON "returns"("order_id");
CREATE INDEX IF NOT EXISTS "idx_returns_status" ON "returns"("status");
CREATE INDEX IF NOT EXISTS "idx_return_items_return_id" ON "return_items"("return_id");
