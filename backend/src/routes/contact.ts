import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { contacts } from '../db/schema';
import { logSecurityEvent, maskEmail } from '../utils/security-events';

const ContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  orderReference: z.string().max(64).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const app = new Hono();

app.post('/', async (c) => {
  let body: Record<string, unknown> = {};

  try {
    body = await c.req.json();
    const validated = ContactSchema.parse(body);
    const formattedMessage = validated.orderReference
      ? `[Order #${validated.orderReference}]\n${validated.message}`
      : validated.message;

    // Save to database
    await db.insert(contacts).values({
      id: crypto.randomUUID(),
      first_name: validated.firstName,
      last_name: validated.lastName,
      email: validated.email,
      message: formattedMessage,
      created_at: new Date(),
    });

    return c.json({
      success: true,
      message: validated.orderReference
        ? `Support request for order #${validated.orderReference} sent successfully. We'll get back to you soon.`
        : "Message sent successfully! We'll get back to you soon.",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      logSecurityEvent('warn', 'Contact form validation failed', c, {
        email: maskEmail(typeof body.email === 'string' ? body.email : null),
        issue_count: error.errors.length,
      });
      return c.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        400
      );
    }
    console.error('Contact form error:', error);
    return c.json(
      {
        error: 'Failed to send message. Please try again.',
      },
      500
    );
  }
});

export default app;
