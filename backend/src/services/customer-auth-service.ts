import { db } from '../db/client';
import { customers } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { config } from '../config';
import crypto from 'node:crypto';
import {
  validatePassword,
  isCommonPassword,
} from '../utils/password-validator';

const JWT_SECRET = config.jwt.secret;

// 🔒 FIX-011: Email verification constants
const VERIFICATION_TOKEN_EXPIRY_MINUTES = 10;

// 🔒 Q9: Account Lockout Configuration (shared constants)
import {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  isAccountLocked,
  getLockoutMessage,
} from '../utils/account-lockout';

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Calculate verification token expiry time
 */
export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + VERIFICATION_TOKEN_EXPIRY_MINUTES);
  return expiry;
}

/**
 * Increment failed login attempts
 */
async function incrementFailedAttempts(customerId: string): Promise<void> {
  await db
    .update(customers)
    .set({
      failed_login_attempts: sql`${customers.failed_login_attempts} + 1`,
    })
    .where(eq(customers.id, customerId));
}

/**
 * Lock account after max failed attempts
 */
async function lockAccount(customerId: string): Promise<void> {
  const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  await db
    .update(customers)
    .set({
      failed_login_attempts: MAX_FAILED_ATTEMPTS,
      locked_until: lockedUntil,
    })
    .where(eq(customers.id, customerId));
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(customerId: string): Promise<void> {
  await db
    .update(customers)
    .set({
      failed_login_attempts: 0,
      locked_until: null,
    })
    .where(eq(customers.id, customerId));
}

export const RegisterCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must contain at least one special character'
    ),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export const LoginCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const customerAuthService = {
  async setupPassword(token: string, password: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.verification_token, token))
      .limit(1);

    if (!customer) {
      throw new Error('Invalid or expired token');
    }

    if (
      customer.verification_expires_at &&
      customer.verification_expires_at < new Date()
    ) {
      throw new Error('Token has expired');
    }

    if (customer.password_hash && customer.password_hash !== '') {
      throw new Error('Password already set');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(
        `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`
      );
    }

    if (isCommonPassword(password)) {
      throw new Error(
        'Password is too common. Please choose a more secure password.'
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [updated] = await db
      .update(customers)
      .set({
        password_hash,
        verification_token: null,
        verification_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id))
      .returning();

    return updated;
  },

  async register(data: z.infer<typeof RegisterCustomerSchema>) {
    // Check if customer exists
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email.toLowerCase()));

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

    const password_hash = await bcrypt.hash(data.password, 10);
    const duplicateAccountMessage =
      'Unable to create account with this email. Please sign in, verify your email, or reset your password.';

    if (existing.length > 0) {
      const customer = existing[0];
      if (customer.has_account) {
        if (!customer.email_verified) {
          const verificationToken = generateVerificationToken();
          const verificationExpires = getVerificationExpiry();

          await db
            .update(customers)
            .set({
              verification_token: verificationToken,
              verification_expires_at: verificationExpires,
              updated_at: new Date(),
            })
            .where(eq(customers.id, customer.id));

          try {
            const { emailService } = await import('./email-service');
            emailService
              .sendVerificationEmail({
                email: customer.email,
                first_name: customer.first_name || data.first_name,
                token: verificationToken,
              })
              .catch(emailError =>
                console.error('Failed to resend verification email:', emailError)
              );
          } catch (emailError: unknown) {
            console.error('Failed to load email service:', emailError);
          }
        }

        throw new Error(duplicateAccountMessage);
      }

      // Upgrade guest to account
      const plaintextOtp = generateVerificationToken();
      const verificationExpires = getVerificationExpiry();
      const hashedOtp = await bcrypt.hash(plaintextOtp, 10);

      const updated = await db
        .update(customers)
        .set({
          has_account: true,
          password_hash,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          updated_at: new Date(),
          failed_login_attempts: 0,
          locked_until: null,
          verification_token: hashedOtp,
          verification_expires_at: verificationExpires,
          email_verified: false,
        })
        .where(eq(customers.id, customer.id))
        .returning();

      const newCustomer = updated[0];

      // Send verification email in background to avoid 504 timeouts
      try {
        const { emailService } = await import('./email-service');
        emailService.sendVerificationEmail({
          email: newCustomer.email,
          first_name: newCustomer.first_name!,
          token: plaintextOtp,
        }).catch(emailError => console.error('Failed to send email:', emailError));
        
        if (newCustomer.phone) {
          const { smsService } = await import('./sms-service');
          smsService.sendOtp(newCustomer.phone, plaintextOtp);
        }
      } catch (err) {
        console.error('Failed to load email service:', err);
      }

      return newCustomer;
    } else {
      // Create new customer
      const plaintextOtp = generateVerificationToken();
      const verificationExpires = getVerificationExpiry();
      const hashedOtp = await bcrypt.hash(plaintextOtp, 10);

      const created = await db
        .insert(customers)
        .values({
          email: data.email.toLowerCase(),
          password_hash,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          has_account: true,
          verification_token: hashedOtp,
          verification_expires_at: verificationExpires,
          email_verified: false,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .returning();

      const newCustomer = created[0];

      // Send verification email asynchronously
      try {
        const { emailService } = await import('./email-service');
        emailService.sendVerificationEmail({
          email: newCustomer.email,
          first_name: newCustomer.first_name!,
          token: plaintextOtp,
        }).catch(emailError => console.error('Failed to send verification email:', emailError));
        
        if (newCustomer.phone) {
          const { smsService } = await import('./sms-service');
          smsService.sendOtp(newCustomer.phone, plaintextOtp);
        }
      } catch (emailError: unknown) {
        console.error('Failed to load email service:', emailError);
      }

      return newCustomer;
    }
  },

  async login(data: z.infer<typeof LoginCustomerSchema>) {
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email.toLowerCase()));

    if (existing.length === 0 || !existing[0].has_account) {
      throw new Error('Invalid email or password');
    }

    // Social-only account — no password set, must use social login
    if (!existing[0].password_hash) {
      throw new Error('This account was created with social login. Please sign in with Google or Facebook.');
    }

    const customer = existing[0];

    // 🔒 Q9: Check if account is locked
    if (isAccountLocked(customer.locked_until)) {
      throw new Error(getLockoutMessage(customer.locked_until!));
    }

    const valid = await bcrypt.compare(data.password, customer.password_hash!);

    if (!valid) {
      // Increment failed attempts
      await incrementFailedAttempts(customer.id);

      // Check if we should lock the account
      const newFailedAttempts = (customer.failed_login_attempts || 0) + 1;
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        await lockAccount(customer.id);
        throw new Error(
          getLockoutMessage(new Date(Date.now() + LOCKOUT_DURATION_MS))
        );
      }

      const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      throw new Error(
        `Invalid credentials. ${attemptsRemaining} attempts remaining before lockout.`
      );
    }

    // 🔒 FIX-011: Check if email is verified AFTER password validation
    // Don't count this as a failed attempt — password was correct
    if (!customer.email_verified) {
      // Reset failed attempts since password was correct
      await resetFailedAttempts(customer.id);
      throw new Error(
        'Please verify your email before logging in. Check your inbox for the verification link.'
      );
    }

    // 🔒 Q9: Reset failed attempts on successful login
    await resetFailedAttempts(customer.id);

    const token = await sign(
      {
        sub: customer.id,
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET
    );

    return { token, customer };
  },

  // 🔒 FIX-011: Email verification methods

  async verifyEmail(token: string) {
    // Find customer with this verification token
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.verification_token, token))
      .limit(1);

    if (!customer) {
      throw new Error('Invalid verification token');
    }

    // Check if token has expired
    if (
      customer.verification_expires_at &&
      customer.verification_expires_at < new Date()
    ) {
      throw new Error('Verification token has expired');
    }

    // Check if already verified
    if (customer.email_verified) {
      throw new Error('Email is already verified');
    }

    // Update customer to verified
    const [updated] = await db
      .update(customers)
      .set({
        email_verified: true,
        verification_token: null,
        verification_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id))
      .returning();

    return updated;
  },

  async resendVerificationEmail(email: string) {
    // Always return generic success to prevent email enumeration
    const genericResponse = { message: 'If this email exists and is unverified, a verification link has been sent.' };

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    // Silently return if customer not found or already verified
    if (!customer || customer.email_verified) {
      return genericResponse;
    }

    // Generate new verification token
    const plaintextOtp = generateVerificationToken();
    const verificationExpires = getVerificationExpiry();
    const hashedOtp = await bcrypt.hash(plaintextOtp, 10);

    // Update customer with new token
    await db
      .update(customers)
      .set({
        verification_token: hashedOtp,
        verification_expires_at: verificationExpires,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id));

    // Send verification email asynchronously
    const { emailService } = await import('./email-service');
    emailService.sendVerificationEmail({
      email: customer.email,
      first_name: customer.first_name!,
      token: plaintextOtp,
    }).catch(emailError => console.error('Failed to send verification email:', emailError));

    if (customer.phone) {
      const { smsService } = await import('./sms-service');
      smsService.sendOtp(customer.phone, plaintextOtp);
    }

    return genericResponse;
  },

  async verifyOtp(email: string, otp: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    if (!customer) {
      throw new Error('Invalid or expired OTP');
    }

    if (customer.email_verified) {
      throw new Error('Email is already verified');
    }

    if (!customer.verification_token || !customer.verification_expires_at) {
      throw new Error('No pending verification found');
    }

    if (new Date() > customer.verification_expires_at) {
      throw new Error('OTP has expired');
    }

    const isValid = await bcrypt.compare(otp, customer.verification_token);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    // Update to verified
    const [updated] = await db
      .update(customers)
      .set({
        email_verified: true,
        verification_token: null,
        verification_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id))
      .returning();

    // Generate login token
    const token = await sign(
      { sub: updated.id, email: updated.email, role: 'customer', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
      config.jwt.secret
    );

    const { password_hash, ...customerInfo } = updated;
    return { customer: customerInfo, token };
  },

  async getVerificationStatus(email: string) {
    const [customer] = await db
      .select({
        email_verified: customers.email_verified,
        has_account: customers.has_account,
      })
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    if (!customer) {
      return {
        is_verified: false,
        requires_verification: false,
      };
    }

    return {
      is_verified: customer.email_verified,
      requires_verification: customer.has_account && !customer.email_verified,
    };
  },

  // 🔒 FIX-010: Get customer by token (for cookie-based auth)
  async getCustomer(token: string) {
    try {
      // Verify and decode the JWT token
      const payload = await verify(token, JWT_SECRET, 'HS256');
      const customerId = payload.sub as string;

      const [customer] = await db
        .select({
          id: customers.id,
          email: customers.email,
          first_name: customers.first_name,
          last_name: customers.last_name,
          phone: customers.phone,
          has_account: customers.has_account,
          email_verified: customers.email_verified,
          created_at: customers.created_at,
        })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (!customer) {
        throw new Error('Customer not found');
      }

      return { customer };
    } catch (error: unknown) {
      // Log original error for debugging, return generic message for security
      console.error('getCustomer token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  },

  // Social Login (Google/Facebook)
  async socialLogin({
    provider,
    providerId,
    email,
    name,
    avatar,
  }: {
    provider: 'google' | 'facebook';
    providerId: string;
    email: string;
    name?: string;
    avatar?: string;
  }) {
    // Find or create customer
    let [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    let isNewUser = false;

    if (customer) {
      // Update existing customer with social login info
      await db
        .update(customers)
        .set({
          email_verified: true,
          has_account: true,
          updated_at: new Date(),
        })
        .where(eq(customers.id, customer.id));
    } else {
      // Create new customer
      const nameParts = (name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      [customer] = await db
        .insert(customers)
        .values({
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          password_hash: null, // Social-only account — no password set
          email_verified: true, // Social login verifies email
          has_account: true,
        })
        .returning();

      isNewUser = true;
    }

    // Generate JWT token
    const token = await sign(
      {
        sub: customer.id,
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET
    );

    return { token, customer, isNewUser };
  },

  // 🔒 Password Reset Methods
  async requestPasswordReset(email: string) {
    console.log('[ForgotPassword] Processing request for:', email);
    
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    console.log('[ForgotPassword] Customer found:', customer ? 'yes - id: ' + customer.id : 'no');
    console.log('[ForgotPassword] has_account:', customer?.has_account);

    // Always return success to prevent email enumeration
    if (!customer) {
      console.log('[ForgotPassword] No customer found, returning success');
      return {
        success: true,
        message: 'If an account exists, you will receive a password reset link.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(customers)
      .set({
        reset_token: resetToken,
        reset_token_expires_at: resetExpires,
        reset_attempts: 0,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id));

    // Send email
    try {
      const { emailService } = await import('./email-service');
      await emailService.sendPasswordResetEmail({
        email: customer.email,
        first_name: customer.first_name || 'Customer',
        token: resetToken,
      });
    } catch (e) {
      console.error('Failed to send reset email:', e);
    }

    return {
      success: true,
      message: 'If an account exists, you will receive a password reset link.',
    };
  },

  async resetPassword(token: string, newPassword: string) {
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(
        `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`
      );
    }

    if (isCommonPassword(newPassword)) {
      throw new Error('Password is too common. Please choose a more secure password.');
    }

    // Find customer by token
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.reset_token, token))
      .limit(1);

    if (!customer) {
      throw new Error('Invalid or expired reset token');
    }

    if (!customer.reset_token_expires_at || customer.reset_token_expires_at < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Hash and update password
    const password_hash = await bcrypt.hash(newPassword, 10);

    await db
      .update(customers)
      .set({
        password_hash,
        reset_token: null,
        reset_token_expires_at: null,
        reset_attempts: 0,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id));

    return { success: true, message: 'Password reset successfully' };
  },
};
