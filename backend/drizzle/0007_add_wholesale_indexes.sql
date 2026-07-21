-- Add indexes for wholesale_inquiries table to improve query performance

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_wholesale_status ON wholesale_inquiries(status);

-- Index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_wholesale_created_at ON wholesale_inquiries(created_at DESC);

-- Index on email for search
CREATE INDEX IF NOT EXISTS idx_wholesale_email ON wholesale_inquiries(email);

-- Composite index for common query pattern (status + created_at)
CREATE INDEX IF NOT EXISTS idx_wholesale_status_created ON wholesale_inquiries(status, created_at DESC);

-- Index on company_name for search
CREATE INDEX IF NOT EXISTS idx_wholesale_company ON wholesale_inquiries(company_name);
