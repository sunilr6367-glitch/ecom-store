import { Context } from 'hono';
import net from 'node:net';

function normalizeIp(value: string | null | undefined): string | null {
  if (!value) return null;

  const candidate = value.trim();
  if (!candidate) return null;

  if (candidate.startsWith('::ffff:')) {
    const mapped = candidate.slice(7);
    return net.isIP(mapped) ? mapped : null;
  }

  return net.isIP(candidate) ? candidate : null;
}

export function getClientIp(c: Context): string {
  const realIp = normalizeIp(c.req.header('x-real-ip'));
  if (realIp) return realIp;

  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const firstForwarded = normalizeIp(forwarded.split(',')[0]);
    if (firstForwarded) return firstForwarded;
  }

  return 'anonymous';
}
