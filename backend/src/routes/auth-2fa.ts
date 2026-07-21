import { Hono } from 'hono';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth, AuthContextVariables } from '../middleware/auth';

const app = new Hono<{ Variables: AuthContextVariables }>();

// Generate 2FA Secret & QR Code
app.post('/generate', verifyAuth, async (c) => {
  try {
    const userPayload = c.get('user') as unknown as {
      sub: string;
      role: string;
    };
    // Fetch full user to get email if needed, or rely on the payload
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userPayload.sub));

    if (!user) return c.json({ error: 'User not found' }, 404);

    const secret = speakeasy.generateSecret({ length: 20 }).base32;
    const otpauth = speakeasy.otpauthURL({ 
      secret, 
      label: user.email, 
      issuer: 'Odhvica Admin', 
      encoding: 'base32' 
    });

    // Save secret but keep enabled=false until verified
    await db
      .update(users)
      .set({ two_factor_secret: secret })
      .where(eq(users.id, user.id));

    const qrCode = await QRCode.toDataURL(otpauth);

    // OPT-002 FIX: Don't expose secret in response - only show via QR code
    return c.json({ qrCode });
  } catch (error: any) {
    console.error('2FA Generate Error:', error);
    return c.json({ error: 'Failed to generate 2FA' }, 500);
  }
});

// Verify OTP and Enable 2FA
app.post('/verify', verifyAuth, async (c) => {
  try {
    const userPayload = c.get('user') as unknown as {
      sub: string;
      role: string;
    };
    const { token } = await c.req.json();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userPayload.sub)); // BUG-003 FIX: was userPayload.id (undefined)

    if (!user || !user.two_factor_secret) {
      return c.json({ error: '2FA not initialized. Generate first.' }, 400);
    }

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (isValid) {
      await db
        .update(users)
        .set({ two_factor_enabled: true })
        .where(eq(users.id, user.id));
      return c.json({ success: true, message: '2FA Enabled successfully' });
    } else {
      return c.json({ error: 'Invalid OTP code' }, 400);
    }
  } catch (error: any) {
    console.error('2FA Verify Error:', error);
    return c.json({ error: 'Verification failed' }, 500);
  }
});

// Disable 2FA
app.post('/disable', verifyAuth, async (c) => {
  try {
    const userPayload = c.get('user') as unknown as {
      sub: string;
      role: string;
    };
    const { token } = await c.req.json();

    // OPT-002 FIX: Require valid OTP code to disable 2FA
    if (!token) {
      return c.json({ error: 'OTP code is required to disable 2FA' }, 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userPayload.sub));

    if (!user || !user.two_factor_secret || !user.two_factor_enabled) {
      return c.json({ error: '2FA is not enabled' }, 400);
    }

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      return c.json({ error: 'Invalid OTP code' }, 400);
    }

    await db
      .update(users)
      .set({ two_factor_enabled: false, two_factor_secret: null })
      .where(eq(users.id, userPayload.sub));

    return c.json({ success: true, message: '2FA Disabled' });
  } catch (error: any) {
    return c.json({ error: 'Failed to disable 2FA' }, 500);
  }
});

export default app;
