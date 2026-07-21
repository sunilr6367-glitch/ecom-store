-- Migration: FIX-003 Add Inventory Non-Negative Check Constraint
-- Purpose: Prevent inventory_quantity from going negative at the database level
-- This is a safety net in addition to the application-level checks (FIX-001 and FIX-002)
-- Date: 2026-02-11

-- Add CHECK constraint to ensure inventory_quantity is never negative
ALTER TABLE product_variants
ADD CONSTRAINT inventory_non_negative
CHECK (inventory_quantity >= 0);

-- Verify the constraint was added
-- This query will fail if the constraint doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'inventory_non_negative'
    ) THEN
        RAISE EXCEPTION 'Constraint inventory_non_negative was not created';
    END IF;
END $$;

-- Comment explaining the constraint
COMMENT ON CONSTRAINT inventory_non_negative ON product_variants
IS 'Prevents inventory_quantity from being negative. Fails the transaction if deduction would result in negative inventory.';
