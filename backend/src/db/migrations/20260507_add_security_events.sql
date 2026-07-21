CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'backend',
  severity text NOT NULL,
  event text NOT NULL,
  ip_address text,
  method text,
  path text,
  details jsonb,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created
  ON security_events (created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_event
  ON security_events (event);

CREATE INDEX IF NOT EXISTS idx_security_events_ip
  ON security_events (ip_address);
