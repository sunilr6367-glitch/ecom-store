/**
 * Store Authentication Routes
 *
 * These routes handle customer authentication including:
 * - Customer registration with email verification
 * - Customer login with httpOnly cookie (FIX-010)
 * - Logout (clears auth cookie)
 * - Email verification (FIX-011)
 * - Legal pages retrieval (FIX-008)
 *
 * Security Features:
 * - JWT stored in httpOnly, Secure cookies (XSS protection)
 * - Email verification required before full access
 * - Password hashing with bcrypt
 * - Token-based verification with expiry
 *
 * @module store/auth
 */

import { Hono, Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  customerAuthService,
  LoginCustomerSchema,
  RegisterCustomerSchema,
} from '../../services/customer-auth-service';
import { z } from 'zod';
import { config } from '../../config';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { emailLimiter } from '../../middleware/rate-limiter';

const storeAuthRouter = new Hono();

// 🔒 FIX-010: Cookie configuration
// Production (Hostinger): sameSite:'none' required for cross-domain HTTPS cookies
// Development (localhost HTTP): sameSite:'lax' required — 'none' needs HTTPS which dev lacks
const isProduction = config.server.env === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax' | 'strict',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

// Helper function to set auth cookie
function setAuthCookie(c: Context, token: string) {
  setCookie(c, 'auth_token', token, COOKIE_OPTIONS);
}

// Helper function to clear auth cookie
function clearAuthCookie(c: Context) {
  deleteCookie(c, 'auth_token', {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
}

// Validation schemas for verification routes
const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(4),
});

const ResendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const GoogleSocialLoginSchema = z.object({
  id_token: z.string().min(1, 'Google token is required'),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

const FacebookSocialLoginSchema = z.object({
  access_token: z.string().min(1, 'Facebook access token is required'),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

interface GoogleTokenInfo {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
}

interface FacebookProfileResponse {
  id?: string;
  email?: string;
  name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  error?: {
    message?: string;
  };
}

async function verifyGoogleIdentity(idToken: string, claimedEmail?: string) {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new Error('Google authentication could not be verified');
  }

  const tokenInfo = (await response.json()) as GoogleTokenInfo;
  const expectedAudience =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (expectedAudience && tokenInfo.aud !== expectedAudience) {
    throw new Error('Google token audience mismatch');
  }

  const emailVerified =
    tokenInfo.email_verified === true || tokenInfo.email_verified === 'true';

  if (!tokenInfo.sub || !tokenInfo.email || !emailVerified) {
    throw new Error('Google account email is not verified');
  }

  if (
    claimedEmail &&
    tokenInfo.email.toLowerCase() !== claimedEmail.toLowerCase()
  ) {
    throw new Error('Google account email mismatch');
  }

  return {
    providerId: tokenInfo.sub,
    email: tokenInfo.email.toLowerCase(),
    name: tokenInfo.name,
    avatar: tokenInfo.picture,
  };
}

async function verifyFacebookIdentity(
  accessToken: string,
  claimedEmail?: string
) {
  const params = new URLSearchParams({
    fields: 'id,name,email,picture',
    access_token: accessToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/me?${params.toString()}`
  );
  const profile = (await response.json()) as FacebookProfileResponse;

  if (!response.ok || profile.error) {
    throw new Error(
      profile.error?.message || 'Facebook authentication could not be verified'
    );
  }

  if (!profile.id || !profile.email) {
    throw new Error(
      'Facebook login requires an email-enabled account permission'
    );
  }

  if (
    claimedEmail &&
    profile.email.toLowerCase() !== claimedEmail.toLowerCase()
  ) {
    throw new Error('Facebook account email mismatch');
  }

  return {
    providerId: profile.id,
    email: profile.email.toLowerCase(),
    name: profile.name,
    avatar: profile.picture?.data?.url,
  };
}

// 🔒 FIX-008: Legal pages endpoint
storeAuthRouter.get('/legal', async (c) => {
  const slug = c.req.query('slug');
  if (!slug) {
    return c.json({ error: 'Slug is required' }, 400);
  }

  const { pages } = await import('../../db/schema');
  const { eq } = await import('drizzle-orm');
  const { db } = await import('../../db/client');

  const [pageData] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);

  if (!pageData || !pageData.is_visible) {
    return c.json({ error: 'Page not found' }, 404);
  }

  return c.json({ page: pageData });
});

// 🔒 FIX-011: Email verification routes

// POST /store/auth/verify-otp - Verify email with OTP
storeAuthRouter.post(
  '/verify-otp',
  zValidator('json', VerifyOtpSchema),
  async (c) => {
    const { email, otp } = c.req.valid('json');

    try {
      const { customer, token } = await customerAuthService.verifyOtp(email, otp);
      setAuthCookie(c, token);
      
      return c.json({
        success: true,
        message: 'Email verified and logged in successfully',
        customer,
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// POST /store/auth/resend-verification - Resend verification email
// 🔒 FIX-004: Rate limited to prevent email bombing attacks
storeAuthRouter.post(
  '/resend-verification',
  emailLimiter,
  zValidator('json', ResendVerificationSchema),
  async (c) => {
    const { email } = c.req.valid('json');

    try {
      const result = await customerAuthService.resendVerificationEmail(email);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// GET /store/auth/verification-status - Check if email is verified
storeAuthRouter.get('/verification-status', async (c) => {
  const email = c.req.query('email');

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const status = await customerAuthService.getVerificationStatus(email);
  return c.json(status);
});

storeAuthRouter.post(
  '/register',
  zValidator('json', RegisterCustomerSchema, (result, c) => {
    if (!result.success) {
      // Format Zod errors as plain JSON
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return c.json(
        {
          success: false,
          message: 'Validation failed',
          errors,
        },
        400
      );
    }
  }),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const customer = await customerAuthService.register(data);

      // 🔒 FIX-011: Do NOT auto-login after registration
      // User must verify their email before logging in
      return c.json({
        customer,
        success: true,
        message:
          'Registration successful! Please check your email to verify your account.',
      });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  }
);

storeAuthRouter.post(
  '/login',
  zValidator('json', LoginCustomerSchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const result = await customerAuthService.login(data);

      // 🔒 FIX-010: Set httpOnly cookie
      setAuthCookie(c, result.token);

      return c.json({
        success: true,
        customer: result.customer,
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 401);
    }
  }
);

// POST /store/auth/setup-password - Set password using token (for wholesale welcome)
storeAuthRouter.post('/setup-password', async (c) => {
  const { token, password } = await c.req.json().catch(() => ({}));

  if (!token || !password) {
    return c.json({ error: 'Token and password are required' }, 400);
  }

  try {
    const customer = await customerAuthService.setupPassword(token, password);

    // Auto-login after password setup
    const loginResult = await customerAuthService.login({
      email: customer.email!,
      password,
    });

    setAuthCookie(c, loginResult.token);

    return c.json({
      success: true,
      message: 'Password set successfully',
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// 🔒 FIX-010: Logout route - clears the cookie
storeAuthRouter.post('/logout', async (c) => {
  clearAuthCookie(c);
  return c.json({ success: true, message: 'Logged out successfully' });
});

// 🔒 FIX-010: Get current auth status (reads from cookie)
storeAuthRouter.get('/me', async (c) => {
  const token =
    getCookie(c, 'auth_token') ||
    c.req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  try {
    const result = await customerAuthService.getCustomer(token);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});


// Social Login - Google
storeAuthRouter.post(
  '/social/google',
  zValidator('json', GoogleSocialLoginSchema),
  async (c) => {
    const { id_token, email } = c.req.valid('json');

    try {
      const verifiedIdentity = await verifyGoogleIdentity(id_token, email);
      const customer = await customerAuthService.socialLogin({
        provider: 'google',
        providerId: verifiedIdentity.providerId,
        email: verifiedIdentity.email,
        name: verifiedIdentity.name,
        avatar: verifiedIdentity.avatar,
      });

      setAuthCookie(c, customer.token);
      return c.json({
        success: true,
        customer: customer.customer,
        isNewUser: customer.isNewUser,
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// Social Login - Facebook
storeAuthRouter.post(
  '/social/facebook',
  zValidator('json', FacebookSocialLoginSchema),
  async (c) => {
    const { access_token, email } = c.req.valid('json');

    try {
      const verifiedIdentity = await verifyFacebookIdentity(
        access_token,
        email
      );
      const customer = await customerAuthService.socialLogin({
        provider: 'facebook',
        providerId: verifiedIdentity.providerId,
        email: verifiedIdentity.email,
        name: verifiedIdentity.name,
        avatar: verifiedIdentity.avatar,
      });

      setAuthCookie(c, customer.token);
      return c.json({
        success: true,
        customer: customer.customer,
        isNewUser: customer.isNewUser,
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  }
);

// POST /store/auth/forgot-password - Request password reset
storeAuthRouter.post('/forgot-password', emailLimiter, async (c) => {
  const { email } = await c.req.json().catch(() => ({}));

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  try {
    const result = await customerAuthService.requestPasswordReset(email);
    // Always return success to prevent email enumeration
    return c.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return c.json({ error: error.message || 'An error occurred. Please try again.' }, 500);
  }
});

// POST /store/auth/reset-password - Reset password with token
storeAuthRouter.post('/reset-password', async (c) => {
  const { token, password } = await c.req.json().catch(() => ({}));

  if (!token || !password) {
    return c.json({ error: 'Token and password are required' }, 400);
  }

  try {
    const result = await customerAuthService.resetPassword(token, password);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

export default storeAuthRouter;
