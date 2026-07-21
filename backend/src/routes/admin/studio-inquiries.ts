import { Hono } from 'hono';
import { z } from 'zod';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { products, studio_inquiries, studio_inquiry_messages } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';
import { broadcastStudioMessage } from '../../services/socket';

const router = new Hono();

const UpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'replied', 'closed']).optional(),
  admin_notes: z.string().max(2000).optional(),
});

const AdminMessageSchema = z.object({
  message: z.string().min(2, 'Reply message is required').max(2000),
  sender_name: z.string().max(120).optional(),
});

router.get('/', verifyAdmin, async (c) => {
  try {
    const { status, inquiry_type, product_id } = c.req.query();
    const conditions = [];

    if (status && status !== 'all') conditions.push(eq(studio_inquiries.status, status));
    if (inquiry_type && inquiry_type !== 'all') conditions.push(eq(studio_inquiries.inquiry_type, inquiry_type));
    if (product_id) conditions.push(eq(studio_inquiries.product_id, product_id));

    const inquiries = await db
      .select({
        id: studio_inquiries.id,
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
        unread_by_admin: studio_inquiries.unread_by_admin,
        unread_by_customer: studio_inquiries.unread_by_customer,
        created_at: studio_inquiries.created_at,
        updated_at: studio_inquiries.updated_at,
        product_thumbnail: products.thumbnail,
      })
      .from(studio_inquiries)
      .leftJoin(products, eq(studio_inquiries.product_id, products.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(studio_inquiries.last_message_at))
      .limit(500);

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        new: sql<number>`count(*) filter (where status = 'new')`,
        in_progress: sql<number>`count(*) filter (where status = 'in_progress')`,
        replied: sql<number>`count(*) filter (where status = 'replied')`,
        custom_size: sql<number>`count(*) filter (where inquiry_type = 'custom_size')`,
        unread: sql<number>`count(*) filter (where unread_by_admin = true)`,
      })
      .from(studio_inquiries);

    return c.json({
      inquiries,
      stats: {
        total: Number(stats?.total || 0),
        new: Number(stats?.new || 0),
        in_progress: Number(stats?.in_progress || 0),
        replied: Number(stats?.replied || 0),
        custom_size: Number(stats?.custom_size || 0),
        unread: Number(stats?.unread || 0),
      },
    });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] GET error:', error.message);
    return c.json({ error: 'Failed to fetch studio inquiries' }, 500);
  }
});

router.get('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    const [inquiry] = await db
      .select({
        id: studio_inquiries.id,
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
        unread_by_admin: studio_inquiries.unread_by_admin,
        unread_by_customer: studio_inquiries.unread_by_customer,
        created_at: studio_inquiries.created_at,
        updated_at: studio_inquiries.updated_at,
        product_thumbnail: products.thumbnail,
      })
      .from(studio_inquiries)
      .leftJoin(products, eq(studio_inquiries.product_id, products.id))
      .where(eq(studio_inquiries.id, id))
      .limit(1);

    if (!inquiry) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }

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
      .where(eq(studio_inquiry_messages.inquiry_id, id))
      .orderBy(asc(studio_inquiry_messages.created_at));

    await db
      .update(studio_inquiries)
      .set({ unread_by_admin: false, updated_at: new Date() })
      .where(eq(studio_inquiries.id, id));

    return c.json({ inquiry, messages });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] GET detail error:', error.message);
    return c.json({ error: 'Failed to fetch inquiry conversation' }, 500);
  }
});

router.post('/:id/messages', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = AdminMessageSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        },
        400
      );
    }

    const [existing] = await db
      .select({
        id: studio_inquiries.id,
        email: studio_inquiries.email,
        customer_name: studio_inquiries.customer_name,
        product_title: studio_inquiries.product_title,
        product_handle: studio_inquiries.product_handle,
        product_url: studio_inquiries.product_url,
        inquiry_type: studio_inquiries.inquiry_type,
        conversation_token: studio_inquiries.conversation_token,
        phone: studio_inquiries.phone,
        created_at: studio_inquiries.created_at,
      })
      .from(studio_inquiries)
      .where(eq(studio_inquiries.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }

    const [message] = await db
      .insert(studio_inquiry_messages)
      .values({
        inquiry_id: id,
        sender_type: 'admin',
        sender_name: parsed.data.sender_name || 'Odhvica Studio',
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
        status: 'replied',
        message: parsed.data.message,
        last_message_at: new Date(),
        unread_by_admin: false,
        unread_by_customer: true,
        updated_at: new Date(),
      })
      .where(eq(studio_inquiries.id, id));

    broadcastStudioMessage(id, message, {
      id,
      product_title: existing.product_title,
      product_handle: existing.product_handle,
      inquiry_type: existing.inquiry_type,
      status: 'replied',
      customer_name: existing.customer_name,
      email: existing.email,
      phone: existing.phone,
      message: parsed.data.message,
      last_message_at: new Date(),
      unread_by_admin: false,
      unread_by_customer: true,
      created_at: existing.created_at,
    });

    if (existing.email && existing.conversation_token) {
      const productPath = existing.product_url || `${process.env.STOREFRONT_URL || process.env.FRONTEND_URL || 'https://odhvica.com'}/products/${existing.product_handle || id}`;
      const separator = productPath.includes('?') ? '&' : '?';
      const conversationUrl = `${productPath}${separator}chat=${encodeURIComponent(id)}&token=${encodeURIComponent(existing.conversation_token)}`;
      import('../../services/email-service')
        .then(({ emailService }) =>
          emailService.sendStudioReplyNotification({
            email: existing.email!,
            customer_name: existing.customer_name,
            product_title: existing.product_title,
            message: parsed.data.message,
            conversation_url: conversationUrl,
          })
        )
        .catch((emailError) => console.error('[StudioInquiries Admin] Failed to send reply email:', emailError));
    }

    return c.json({ success: true, message });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] POST message error:', error.message);
    return c.json({ error: 'Failed to send reply' }, 500);
  }
});

router.patch('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = UpdateSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => e.message),
        },
        400
      );
    }

    const [inquiry] = await db
      .update(studio_inquiries)
      .set({
        ...parsed.data,
        updated_at: new Date(),
      })
      .where(eq(studio_inquiries.id, id))
      .returning({ id: studio_inquiries.id });

    if (!inquiry) {
      return c.json({ error: 'Inquiry not found' }, 404);
    }

    return c.json({ success: true, inquiry });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] PATCH error:', error.message);
    return c.json({ error: 'Failed to update inquiry' }, 500);
  }
});

router.delete('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(studio_inquiries).where(eq(studio_inquiries.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    console.error('[StudioInquiries Admin] DELETE error:', error.message);
    return c.json({ error: 'Failed to delete inquiry' }, 500);
  }
});

export default router;
