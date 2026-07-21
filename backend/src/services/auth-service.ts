import { db } from '../db/client';
import { users } from '../db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sign } from 'hono/jwt';
import { config } from '../config';
import {
  validatePassword,
  isCommonPassword,
} from '../utils/password-validator';
import speakeasy from 'speakeasy';

// --- Configuration ---
const JWT_SECRET = config.jwt.secret;

// --- Q9: Account Lockout Configuration (shared constants) ---
import {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  isAccountLocked,
  getLockoutMessage,
} from '../utils/account-lockout';

// --- Types & Schemas ---

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1), // Will be validated separately
  twoFactorCode: z.string().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12), // Minimum 12 characters
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

// --- Helper Functions ---

/**
 * Increment failed login attempts
 */
async function incrementFailedAttempts(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      failed_login_attempts: sql`${users.failed_login_attempts} + 1`,
    })
    .where(eq(users.id, userId));
}

/**
 * Lock account after max failed attempts
 */
async function lockAccount(userId: string): Promise<void> {
  const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  await db
    .update(users)
    .set({
      failed_login_attempts: MAX_FAILED_ATTEMPTS,
      locked_until: lockedUntil,
    })
    .where(eq(users.id, userId));
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      failed_login_attempts: 0,
      locked_until: null,
    })
    .where(eq(users.id, userId));
}

export class AuthService {
  /**
   * Authenticate a user and return a JWT token.
   * Implements account lockout after 5 failed attempts.
   */
  async login(data: LoginInput) {
    // 1. Find user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    const user = result[0];

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 🔒 Q9: Check if account is locked
    if (isAccountLocked(user.locked_until)) {
      throw new Error(getLockoutMessage(user.locked_until!));
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(data.password, user.password_hash);

    if (!isMatch) {
      // Increment failed attempts
      await incrementFailedAttempts(user.id);

      // Check if we should lock the account
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        await lockAccount(user.id);
        throw new Error(
          getLockoutMessage(new Date(Date.now() + LOCKOUT_DURATION_MS))
        );
      }

      const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      throw new Error(
        `Invalid credentials. ${attemptsRemaining} attempts remaining before lockout.`
      );
    }

    // 3. Check 2FA
    if (user.two_factor_enabled) {
      if (!data.twoFactorCode) {
        throw new Error('2FA_REQUIRED');
      }

      if (!user.two_factor_secret) {
        throw new Error('2FA enabled but secret missing');
      }

      const isValid = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: data.twoFactorCode,
        window: 1,
      });

      if (!isValid) {
        await incrementFailedAttempts(user.id);
        throw new Error('Invalid 2FA Code');
      }
    }

    // 🔒 Q9: Reset failed attempts on successful login
    await resetFailedAttempts(user.id);

    // 4. Generate Token (hono/jwt uses exp as unix timestamp)
    const token = await sign(
      { sub: user.id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      JWT_SECRET
    );

    // Return user info (excluding password) and token
    const { password_hash, failed_login_attempts, locked_until, ...userInfo } =
      user;
    return { user: userInfo, token };
  }

  /**
   * Register a new admin user.
   */
  async register(data: RegisterInput) {
    // 1. Check if user exists
    const existingResult = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    const existing = existingResult[0];

    if (existing) {
      throw new Error('User already exists');
    }

    // 🔒 Q10: Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(
        `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`
      );
    }

    // 🔒 Q10: Check for common passwords
    if (isCommonPassword(data.password)) {
      throw new Error(
        'Password is too common. Please choose a more secure password.'
      );
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    // 3. Create user
    const newUserResult = await db
      .insert(users)
      .values({
        email: data.email,
        password_hash: hash,
        first_name: data.first_name,
        last_name: data.last_name,
        role: 'admin',
        failed_login_attempts: 0,
        locked_until: null,
      })
      .returning();
    const newUser = newUserResult[0];

    // 4. Generate Token (hono/jwt uses exp as unix timestamp)
    const token = await sign(
      { sub: newUser.id, email: newUser.email, role: newUser.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      JWT_SECRET
    );

    const { password_hash, failed_login_attempts, locked_until, ...userInfo } =
      newUser;
    return { user: userInfo, token };
  }
}

export const authService = new AuthService();
