-- Migration: Admin audit log table
-- Guide Section 7.3

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  user_role   VARCHAR(20),
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user
  ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created
  ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action
  ON admin_audit_log(action);
