import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { customers } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sign, verify } from 'hono/jwt';
import { setCookie } from 'hono/cookie';
import { config } from '../../config';
import { customerAuthService } from '../../services/customer-auth-service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { otpGenerationLimiter } from '../../middleware/rate-limiter';

const checkoutAuthRouter = new Hono();

// Helper to set auth cookie
const setAuthCookie = (c: any, token: string) => {
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
};

function generateVerificationToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getVerificationExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

const SendOtpSchema = z.object({
  email: z.string().email(),
});

// POST /store/checkout/auth/send-otp
checkoutAuthRouter.post(
  '/send-otp',
  otpGenerationLimiter,
  zValidator('json', SendOtpSchema),
  async (c) => {
    const { email } = c.req.valid('json');
    const normalizedEmail = email.toLowerCase();

    // Find customer
    let [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, normalizedEmail))
      .limit(1);

    const plaintextOtp = generateVerificationToken();
    const verificationExpires = getVerificationExpiry();
    const hashedOtp = await bcrypt.hash(plaintextOtp, 10);

    if (customer) {
      // Update existing customer (guest or registered)
      await db
        .update(customers)
        .set({
          verification_token: hashedOtp,
          verification_expires_at: verificationExpires,
          verification_attempts: 0,
          updated_at: new Date(),
        })
        .where(eq(customers.id, customer.id));
    } else {
      // Create new guest customer
      const created = await db
        .insert(customers)
        .values({
          email: normalizedEmail,
          has_account: false, // Default to guest
          verification_token: hashedOtp,
          verification_expires_at: verificationExpires,
          verification_attempts: 0,
          email_verified: false,
        })
        .returning();
      customer = created[0];
    }

    // Send verification email asynchronously
    try {
      const { emailService } = await import('../../services/email-service');
      emailService
        .sendVerificationEmail({
          email: customer.email,
          first_name: customer.first_name || 'Guest',
          token: plaintextOtp,
        })
        .catch((emailError) =>
          console.error('Failed to send verification email (checkout):', emailError)
        );
    } catch (err) {
      console.error('Failed to load email service:', err);
    }

    return c.json({ success: true, message: 'OTP sent successfully' });
  }
);

const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

// POST /store/checkout/auth/verify-otp
checkoutAuthRouter.post(
  '/verify-otp',
  zValidator('json', VerifyOtpSchema),
  async (c) => {
    const { email, otp } = c.req.valid('json');
    const normalizedEmail = email.toLowerCase();

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, normalizedEmail))
      .limit(1);

    if (!customer) {
      return c.json({ error: 'Invalid or expired OTP' }, 400);
    }

    if (!customer.verification_token || !customer.verification_expires_at) {
      return c.json({ error: 'No pending verification found' }, 400);
    }

    if (new Date() > customer.verification_expires_at) {
      return c.json({ error: 'OTP has expired' }, 400);
    }

    if ((customer.verification_attempts || 0) >= 5) {
      return c.json({ error: 'Too many attempts. Request a new OTP.' }, 429);
    }

    const isValid = await bcrypt.compare(otp, customer.verification_token);
    if (!isValid) {
      const newAttempts = (customer.verification_attempts || 0) + 1;
      
      if (newAttempts >= 5) {
        await db
          .update(customers)
          .set({
            verification_token: null,
            verification_expires_at: null,
            verification_attempts: 5,
            updated_at: new Date(),
          })
          .where(eq(customers.id, customer.id));
        return c.json({ error: 'Too many attempts. Request a new OTP.' }, 429);
      }

      await db
        .update(customers)
        .set({ verification_attempts: newAttempts })
        .where(eq(customers.id, customer.id));

      return c.json({ error: 'Invalid OTP' }, 400);
    }

    // Update customer as verified
    const [updated] = await db
      .update(customers)
      .set({
        email_verified: true,
        verification_token: null,
        verification_expires_at: null,
        verification_attempts: 0,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id))
      .returning();

    // Issue auth token regardless of has_account to allow checkout
    // If has_account is true, this effectively logs them in.
    // If has_account is false, this identifies them as a verified guest during the session.
    const token = await sign(
      {
        sub: updated.id,
        email: updated.email,
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      config.jwt.secret
    );

    setAuthCookie(c, token);

    const { password_hash, verification_token, ...customerInfo } = updated;
    return c.json({
      success: true,
      message: 'Email verified successfully',
      customer: customerInfo,
    });
  }
);

export { checkoutAuthRouter };
