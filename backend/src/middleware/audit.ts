import { Context, Next } from 'hono';
import { db } from '../db/client';
import { admin_audit_log } from '../db/schema';
import { getClientIp } from '../utils/client-ip';

type AuditAction =
  | 'category.create' | 'category.update' | 'category.delete'
  | 'collection.create' | 'collection.update' | 'collection.status_change' | 'collection.delete'
  | 'product.create' | 'product.update' | 'product.category_change' | 'product.delete' | 'product.status_change'
  | 'nav.update' | 'role.change' | 'redirect.create' | 'redirect.delete'
  | 'region.create' | 'region.update' | 'region.delete'
  | 'tag.create' | 'tag.update' | 'tag.delete'
  | 'page.create' | 'page.update' | 'page.delete';

/**
 * Middleware factory: wraps a route handler with audit logging.
 * Usage: auditLog('category', 'create')
 */
export function auditLog(entityType: string, action: AuditAction) {
  return async (c: Context, next: Next) => {
    const entityId = c.req.param('id') || undefined;

    await next();

    // Only log on successful mutations (2xx responses)
    const status = c.res.status;
    if (status < 200 || status >= 300) return;

    try {
      const user = (c as any).get?.('user');
      const userId = user?.sub || 'unknown';
      const userRole = user?.role || 'unknown';
      const ip = getClientIp(c);
      const oldValue =
        ((c as any).get?.('auditOldValue') as Record<string, unknown> | null) ||
        null;

      // Try to get response body as new_value
      let newValue: Record<string, unknown> | null = null;
      try {
        const clone = c.res.clone();
        const body = await clone.json();
        newValue =
          body && typeof body === 'object' && !Array.isArray(body)
            ? (body as Record<string, unknown>)
            : null;
      } catch {
        // Response not JSON — skip
      }

      await db.insert(admin_audit_log).values({
        user_id: userId === 'unknown' ? undefined : userId,
        user_role: userRole,
        action,
        entity_type: entityType,
        entity_id: entityId || undefined,
        old_value: oldValue,
        new_value: newValue,
        ip_address: ip,
      } as any);
    } catch (err) {
      // Audit log failure should not break the request
      console.error('[AuditLog] Failed to write audit log:', err);
    }
  };
}
