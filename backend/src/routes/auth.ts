import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';
import {
  authService,
  LoginSchema,
  RegisterSchema,
} from '../services/auth-service';
import { verifyAuth, AuthContextVariables } from '../middleware/auth';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  asyncHandler,
  AuthError,
  NotFoundError,
} from '../middleware/error-handler';
import { successResponse, HttpStatus } from '../utils/api-response';
import { config } from '../config';
import { serializeUser } from '../utils/safe-user';

const authRouter = new Hono<{ Variables: AuthContextVariables }>();
const allowAdminBootstrap = process.env.ALLOW_ADMIN_BOOTSTRAP === 'true';

// Cookie configuration for httpOnly JWT storage
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

// GET /auth/csrf
// Compatibility endpoint for storefront helpers. Mutating backend routes are
// protected by origin/cookie controls today, so this token is advisory.
authRouter.get(
  '/csrf',
  asyncHandler(async (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json({
      csrf_token: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    });
  })
);

// POST /auth/login
authRouter.post(
  '/login',
  zValidator('json', LoginSchema),
  asyncHandler(async (c) => {
    // Use typed validation with schema
    const data = c.req.valid('json');

    try {
      const result = await authService.login(data);
      // Set JWT in httpOnly cookie for XSS protection
      setCookie(c, 'admin_token', result.token, COOKIE_OPTIONS);
      // Return user data only (token is in cookie)
      return successResponse(c, { user: result.user }, 'Login successful');
    } catch (error: any) {
      // 2FA flow — special response shape expected by frontend
      if (error.message === '2FA_REQUIRED') {
        return c.json(
          {
            success: false,
            message: 'Two-Factor Authentication Required',
            require2fa: true,
          },
          HttpStatus.FORBIDDEN
        );
      }

      if (error.message === 'Invalid 2FA Code') {
        throw new AuthError('Invalid 2FA Code');
      }

      // Any authentication failure (wrong password, account locked, user not found,
      // too many attempts) → 401. These are expected business-logic errors, NOT
      // server errors. Previously these fell through to the generic 500 handler.
      if (
        error.message?.includes('Invalid') ||
        error.message?.includes('locked') ||
        error.message?.includes('attempts remaining') ||
        error.message?.includes('Try again in')
      ) {
        throw new AuthError(error.message);
      }

      // Anything else (DB connection failure, unexpected crash) → let the
      // global error handler return 500.
      throw error;
    }
  })
);

// POST /auth/register
authRouter.post(
  '/register',
  zValidator('json', RegisterSchema),
  asyncHandler(async (c) => {
    if (!allowAdminBootstrap) {
      return c.json({ error: 'Not found' }, HttpStatus.NOT_FOUND);
    }

    const data = c.req.valid('json');
    const result = await authService.register(data);
    // Set JWT in httpOnly cookie for XSS protection
    setCookie(c, 'admin_token', result.token, COOKIE_OPTIONS);
    // Return user data only (token is in cookie)
    return successResponse(
      c,
      { user: result.user },
      'Registration successful',
      HttpStatus.CREATED
    );
  })
);

// POST /auth/logout - Clear the httpOnly cookie
authRouter.post(
  '/logout',
  asyncHandler(async (c) => {
    deleteCookie(c, 'admin_token', {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return successResponse(c, null, 'Logout successful');
  })
);

// GET /auth/me - Get current user profile for Settings
authRouter.get(
  '/me',
  verifyAuth,
  asyncHandler(async (c) => {
    const userPayload = c.get('user');
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userPayload.sub));

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 🔒 FIX-007: Use serializeUser utility to ensure password_hash is never leaked
    const safeUser = serializeUser(user);

    return successResponse(
      c,
      {
        user: safeUser,
        two_factor_enabled: user.two_factor_enabled,
      },
      'Profile retrieved successfully'
    );
  })
);

export default authRouter;
