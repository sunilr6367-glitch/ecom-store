import { rateLimiter } from 'hono-rate-limiter';
import { Context } from 'hono';
import { getClientIp } from '../utils/client-ip';
import { logSecurityEvent } from '../utils/security-events';

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development' || (!isTest && !isProd);

const createLimiter = (windowMs: number, limit: number, label: string) => {
  const effectiveWindowMs = isTest ? windowMs * 100 : windowMs;
  const effectiveLimit = isTest ? limit * 100 : limit;

  return rateLimiter({
    windowMs: effectiveWindowMs,
    limit: effectiveLimit,
    standardHeaders: 'draft-7',
    keyGenerator: (c: Context) => getClientIp(c),
    handler: (c: Context) => {
      logSecurityEvent('warn', 'Rate limit exceeded', c, {
        limiter: label,
        limit: effectiveLimit,
        window_ms: effectiveWindowMs,
      });

      return c.json(
        {
          error: 'Too many requests. Please wait a moment before trying again.',
        },
        429
      );
    },
  });
};

export const adminAuthLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 120 : 30,
  'admin_auth'
);

export const customerAuthLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 120 : 40,
  'customer_auth'
);

export const checkoutLimiter = createLimiter(
  5 * 60 * 1000,
  isDev ? 40 : 80,
  'checkout'
);

export const otpGenerationLimiter = rateLimiter({
  windowMs: isTest ? 15 * 60 * 100 * 1000 : 15 * 60 * 1000,
  limit: isTest ? 300 : isProd ? 3 : 10,
  standardHeaders: 'draft-7',
  keyGenerator: (c: Context) => getClientIp(c),
  handler: (c: Context) => {
    logSecurityEvent('warn', 'OTP generation limit exceeded', c, { limiter: 'otp_generation' });
    return c.json({ error: 'Too many OTP requests. Try again later.' }, 429);
  },
});

export const generalLimiter = createLimiter(
  60 * 1000,
  isDev ? 500 : 1200,
  'general_api'
);

export const emailLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 6 : 8,
  'email'
);

export const trackingLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 30 : 20,
  'order_tracking'
);

export const contactLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 20 : 6,
  'contact_form'
);

export const newsletterLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 20 : 10,
  'newsletter'
);

export const studioInquiryLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 20 : 10,
  'studio_inquiry'
);

export const verificationLookupLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 60 : 25,
  'verification_lookup'
);

export const restockLimiter = createLimiter(
  15 * 60 * 1000,
  isDev ? 30 : 12,
  'back_in_stock'
);
