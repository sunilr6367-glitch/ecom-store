import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { products, studio_inquiries, studio_inquiry_messages } from '../../db/schema';
import { broadcastStudioInquiryCreated, broadcastStudioMessage } from '../../services/socket';
import { logSecurityEvent, maskEmail } from '../../utils/security-events';

const router = new Hono();

const MeasurementsSchema = z
  .object({
    height: z.string().max(50).optional(),
    bust: z.string().max(50).optional(),
    waist: z.string().max(50).optional(),
    hips: z.string().max(50).optional(),
    preferredLength: z.string().max(80).optional(),
  })
  .partial()
  .optional();

const InquirySchema = z
  .object({
    product_id: z.string().uuid('Invalid product ID').optional(),
    product_title: z.string().min(1, 'Product title is required').max(240),
    product_handle: z.string().max(240).optional(),
    product_url: z.string().url('Invalid product URL').max(1000).optional(),
    inquiry_type: z.enum(['question', 'custom_size', 'shipping']).default('question'),
    customer_name: z.string().min(1, 'Name is required').max(120),
    email: z.string().email('Invalid email address').max(240).optional().or(z.literal('')),
    phone: z.string().max(40).optional().or(z.literal('')),
    message: z.string().min(10, 'Please add a little more detail').max(2000),
    measurements: MeasurementsSchema,
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Email or phone is required',
    path: ['email'],
  });

const TokenSchema = z.object({
  token: z.string().uuid('Invalid conversation token'),
});

const CustomerMessageSchema = z.object({
  token: z.string().uuid('Invalid conversation token'),
  customer_name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(240).optional().or(z.literal('')),
  message: z.string().min(2, 'Please add a message').max(2000),
});

async function getConversation(inquiryId: string, token: string) {
  const [inquiry] = await db
    .select({
      id: studio_inquiries.id,
      conversation_token: studio_inquiries.conversation_token,
      product_id: studio_inquiries.product_id,
      product_title: studio_inquiries.product_title,
      product_handle: studio_inquiries.product_handle,
      product_url: studio_inquiries.product_url,
      inquiry_type: studio_inquiries.inquiry_type,
      customer_name: studio_inquiries.customer_name,
      email: studio_inquiries.email,
      phone: studio_inquiries.phone,
      message: studio_inquiries.message,
      measurements: studio_inquiries.measurements,
      status: studio_inquiries.status,
      admin_notes: studio_inquiries.admin_notes,
      last_message_at: studio_inquiries.last_message_at,
      unread_by_customer: studio_inquiries.unread_by_customer,
      created_at: studio_inquiries.created_at,
    })
    .from(studio_inquiries)
    .where(eq(studio_inquiries.id, inquiryId))
    .limit(1);

  if (!inquiry || inquiry.conversation_token !== token) return null;

  const messages = await db
    .select({
      id: studio_inquiry_messages.id,
      sender_type: studio_inquiry_messages.sender_type,
      sender_name: studio_inquiry_messages.sender_name,
      sender_email: studio_inquiry_messages.sender_email,
      message: studio_inquiry_messages.message,
      created_at: studio_inquiry_messages.created_at,
    })
    .from(studio_inquiry_messages)
    .where(eq(studio_inquiry_messages.inquiry_id, inquiryId))
    .orderBy(asc(studio_inquiry_messages.created_at));

  return { inquiry, messages };
}

router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = InquirySchema.safeParse(body);

    if (!parsed.success) {
      logSecurityEvent('warn', 'Studio inquiry validation failed', c, {
        email: maskEmail(typeof body.email === 'string' ? body.email : null),
        issue_count: parsed.error.errors.length,
      });
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        },
        400
      );
    }

    const data = parsed.data;

    if (data.product_id) {
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, data.product_id))
        .limit(1);

      if (!product) {
        return c.json({ error: 'Product not found' }, 404);
      }
    }

    const conversationToken = randomUUID();
    const [inquiry] = await db
      .insert(studio_inquiries)
      .values({
        conversation_token: conversationToken,
        product_id: data.product_id,
        product_title: data.product_title,
        product_handle: data.product_handle,
        product_url: data.product_url,
        inquiry_type: data.inquiry_type,
        customer_name: data.customer_name,
        email: data.email ? data.email.toLowerCase() : null,
        phone: data.phone || null,
        message: data.message,
        measurements: data.measurements || {},
        status: 'new',
        unread_by_admin: true,
        unread_by_customer: false,
        last_message_at: new Date(),
      })
      .returning({
        id: studio_inquiries.id,
        conversation_token: studio_inquiries.conversation_token,
        product_title: studio_inquiries.product_title,
        product_handle: studio_inquiries.product_handle,
        inquiry_type: studio_inquiries.inquiry_type,
        status: studio_inquiries.status,
        customer_name: studio_inquiries.customer_name,
        email: studio_inquiries.email,
        phone: studio_inquiries.phone,
        message: studio_inquiries.message,
        last_message_at: studio_inquiries.last_message_at,
        unread_by_admin: studio_inquiries.unread_by_admin,
        unread_by_customer: studio_inquiries.unread_by_customer,
        created_at: studio_inquiries.created_at,
      });

    const [message] = await db
      .insert(studio_inquiry_messages)
      .values({
        inquiry_id: inquiry.id,
        sender_type: 'customer',
        sender_name: data.customer_name,
        sender_email: data.email ? data.email.toLowerCase() : null,
        message: data.message,
      })
      .returning({
        id: studio_inquiry_messages.id,
        sender_type: studio_inquiry_messages.sender_type,
        sender_name: studio_inquiry_messages.sender_name,
        sender_email: studio_inquiry_messages.sender_email,
        message: studio_inquiry_messages.message,
        created_at: studio_inquiry_messages.created_at,
      });

    broadcastStudioInquiryCreated(inquiry);

    return c.json(
      {
        success: true,
        inquiry: {
          id: inquiry.id,
          conversation_token: inquiry.conversation_token,
        },
        messages: [message],
        message: 'Thanks. Your studio chat has started.',
      },
      201
    );
  } catch (error: any) {
    console.error('[StudioInquiries] POST error:', error.message);
    return c.json({ error: 'Failed to send inquiry. Please try again.' }, 500);
  }
});

router.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const parsed = TokenSchema.safeParse({ token: c.req.query('token') });

    if (!parsed.success) {
      logSecurityEvent('warn', 'Studio inquiry token missing or invalid', c);
      return c.json({ error: 'Conversation token is required' }, 400);
    }

    const conversation = await getConversation(id, parsed.data.token);
    if (!conversation) {
      logSecurityEvent('warn', 'Studio inquiry conversation not found', c, {
        inquiry_id: id,
      });
      return c.json({ error: 'Conversation not found' }, 404);
    }

    await db
      .update(studio_inquiries)
      .set({ unread_by_customer: false, updated_at: new Date() })
      .where(eq(studio_inquiries.id, id));

    return c.json({ success: true, ...conversation });
  } catch (error: any) {
    console.error('[StudioInquiries] GET conversation error:', error.message);
    return c.json({ error: 'Failed to load conversation' }, 500);
  }
});

router.post('/:id/messages', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = CustomerMessageSchema.safeParse(body);

    if (!parsed.success) {
      logSecurityEvent('warn', 'Studio inquiry message validation failed', c, {
        email: maskEmail(typeof body.email === 'string' ? body.email : null),
        issue_count: parsed.error.errors.length,
        inquiry_id: id,
      });
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        },
        400
      );
    }

    const conversation = await getConversation(id, parsed.data.token);
    if (!conversation) {
      logSecurityEvent('warn', 'Studio inquiry message conversation not found', c, {
        inquiry_id: id,
      });
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const senderName = parsed.data.customer_name || conversation.inquiry.customer_name;
    const senderEmail = parsed.data.email || conversation.inquiry.email || undefined;

    const [message] = await db
      .insert(studio_inquiry_messages)
      .values({
        inquiry_id: id,
        sender_type: 'customer',
        sender_name: senderName,
        sender_email: senderEmail ? senderEmail.toLowerCase() : null,
        message: parsed.data.message,
      })
      .returning({
        id: studio_inquiry_messages.id,
        sender_type: studio_inquiry_messages.sender_type,
        sender_name: studio_inquiry_messages.sender_name,
        sender_email: studio_inquiry_messages.sender_email,
        message: studio_inquiry_messages.message,
        created_at: studio_inquiry_messages.created_at,
      });

    await db
      .update(studio_inquiries)
      .set({
        status: 'in_progress',
        message: parsed.data.message,
        last_message_at: new Date(),
        unread_by_admin: true,
        updated_at: new Date(),
      })
      .where(eq(studio_inquiries.id, id));

    broadcastStudioMessage(id, message, {
      id,
      product_title: conversation.inquiry.product_title,
      product_handle: conversation.inquiry.product_handle,
      inquiry_type: conversation.inquiry.inquiry_type,
      status: 'in_progress',
      customer_name: conversation.inquiry.customer_name,
      email: conversation.inquiry.email,
      phone: conversation.inquiry.phone,
      message: parsed.data.message,
      last_message_at: new Date(),
      unread_by_admin: true,
      unread_by_customer: conversation.inquiry.unread_by_customer,
      created_at: conversation.inquiry.created_at,
    });

    return c.json({ success: true, message });
  } catch (error: any) {
    console.error('[StudioInquiries] POST message error:', error.message);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

export default router;
