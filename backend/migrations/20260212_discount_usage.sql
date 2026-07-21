-- Migration: FIX-006 - Discount Usage Tracking
-- Purpose: Track per-customer discount usage with unique constraint
-- Created: 2026-02-12
-- Note: Uses composite primary key (discount_id, customer_id) - no separate id column

-- Create discount_usage table for tracking per-customer discount usage
CREATE TABLE IF NOT EXISTS discount_usage (
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Composite primary key: one use per customer per discount
    PRIMARY KEY (discount_id, customer_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_discount_usage_customer_id ON discount_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_discount_id ON discount_usage(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_order_id ON discount_usage(order_id);

-- Comment on table and columns for documentation
COMMENT ON TABLE discount_usage IS 'Tracks which customers have used which discount codes (one-time use per customer)';
COMMENT ON COLUMN discount_usage.discount_id IS 'The discount code used';
COMMENT ON COLUMN discount_usage.customer_id IS 'The customer who used the discount';
COMMENT ON COLUMN discount_usage.order_id IS 'The order where the discount was applied';
COMMENT ON COLUMN discount_usage.used_at IS 'When the discount was used';
