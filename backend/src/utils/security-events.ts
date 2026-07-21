import { Context } from 'hono';
import { db } from '../db';
import { security_events } from '../db/schema';
import { getClientIp } from './client-ip';

type SecurityLogLevel = 'info' | 'warn' | 'error';

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const [localPart, domain] = email.toLowerCase().split('@');
  if (!localPart || !domain) return null;

  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export function logSecurityEvent(
  level: SecurityLogLevel,
  event: string,
  c: Context,
  details: Record<string, unknown> = {}
) {
  const payload = {
    ip: getClientIp(c),
    method: c.req.method,
    path: c.req.path,
    ...details,
  };

  console[level](`[Security] ${event} ${JSON.stringify(payload)}`);

  void db
    .insert(security_events)
    .values({
      source: 'backend',
      severity: level,
      event,
      ip_address: payload.ip,
      method: payload.method,
      path: payload.path,
      details,
    })
    .catch((error) => {
      console.error('[Security] Failed to persist security event:', error);
    });
}
