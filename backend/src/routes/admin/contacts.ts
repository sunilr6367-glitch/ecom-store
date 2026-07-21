import { Hono } from 'hono';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { contacts } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';

const contactsRouter = new Hono();

const ORDER_REFERENCE_PATTERN = /^\[Order\s+#([^\]]+)\]\s*/i;

function parseSupportMessage(message: string) {
  const match = message.match(ORDER_REFERENCE_PATTERN);
  const orderReference = match?.[1] || null;
  const body = orderReference ? message.replace(ORDER_REFERENCE_PATTERN, '') : message;

  return {
    order_reference: orderReference,
    is_order_tagged: !!orderReference,
    body: body.trim(),
  };
}

contactsRouter.get('/', verifyAdmin, async (c) => {
  try {
    const { kind = 'all', search = '' } = c.req.query();
    const conditions = [];

    if (kind === 'order') {
      conditions.push(sql`${contacts.message} ~ '^\[Order #'`);
    } else if (kind === 'general') {
      conditions.push(sql`NOT (${contacts.message} ~ '^\[Order #')`);
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(contacts.first_name, pattern),
          like(contacts.last_name, pattern),
          like(contacts.email, pattern),
          like(contacts.message, pattern)
        )
      );
    }

    const rows = await db
      .select()
      .from(contacts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(contacts.created_at))
      .limit(500);

    const requests = rows.map((row) => {
      const parsed = parseSupportMessage(row.message);
      return {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        message: parsed.body,
        raw_message: row.message,
        order_reference: parsed.order_reference,
        is_order_tagged: parsed.is_order_tagged,
        created_at: row.created_at,
      };
    });

    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        order_tagged: sql<number>`count(*) filter (where ${contacts.message} ~ '^\[Order #')`,
        general: sql<number>`count(*) filter (where not (${contacts.message} ~ '^\[Order #'))`,
      })
      .from(contacts);

    return c.json({
      requests,
      stats: {
        total: Number(stats?.total || 0),
        order_tagged: Number(stats?.order_tagged || 0),
        general: Number(stats?.general || 0),
      },
    });
  } catch (error: unknown) {
    console.error('[Admin Contacts] GET error:', error);
    return c.json({ error: 'Failed to fetch support requests' }, 500);
  }
});

contactsRouter.get('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const [row] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);

    if (!row) {
      return c.json({ error: 'Support request not found' }, 404);
    }

    const parsed = parseSupportMessage(row.message);

    return c.json({
      request: {
        id: row.id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        message: parsed.body,
        raw_message: row.message,
        order_reference: parsed.order_reference,
        is_order_tagged: parsed.is_order_tagged,
        created_at: row.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('[Admin Contacts] GET detail error:', error);
    return c.json({ error: 'Failed to fetch support request' }, 500);
  }
});

contactsRouter.delete('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const deleted = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning({ id: contacts.id });

    if (!deleted.length) {
      return c.json({ error: 'Support request not found' }, 404);
    }

    return c.json({ success: true, id });
  } catch (error: unknown) {
    console.error('[Admin Contacts] DELETE error:', error);
    return c.json({ error: 'Failed to delete support request' }, 500);
  }
});

export default contactsRouter;
