-- Migration: Add product studio inquiries for customer product questions and custom sizing
CREATE TABLE IF NOT EXISTS studio_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  product_handle TEXT,
  product_url TEXT,
  inquiry_type TEXT NOT NULL DEFAULT 'question',
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_studio_inquiries_status ON studio_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_studio_inquiries_product_id ON studio_inquiries (product_id);
CREATE INDEX IF NOT EXISTS idx_studio_inquiries_created_at ON studio_inquiries (created_at);
