import { Hono } from 'hono';
import { db } from '../../db/client';
import { notifications } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';
import { eq, desc, sql } from 'drizzle-orm';

const notificationsRouter = new Hono();

// Get all notifications
notificationsRouter.get('/', verifyAdmin, async (c) => {
  try {
    const notificationsList = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.created_at))
      .limit(50);

    return c.json({ notifications: notificationsList });
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Get unread count
notificationsRouter.get('/unread-count', verifyAdmin, async (c) => {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.read, false));

    return c.json({ count: result[0]?.count || 0 });
  } catch (error: unknown) {
    console.error('Error fetching unread count:', error);
    return c.json({ error: 'Failed to fetch unread count' }, 500);
  }
});

// Mark notification as read
notificationsRouter.post('/:id/read', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error marking notification as read:', error);
    return c.json({ error: 'Failed to mark notification as read' }, 500);
  }
});

// Mark all as read
notificationsRouter.post('/read-all', verifyAdmin, async (c) => {
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.read, false));

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error marking all notifications as read:', error);
    return c.json({ error: 'Failed to mark all notifications as read' }, 500);
  }
});

// Delete notification
notificationsRouter.delete('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(notifications).where(eq(notifications.id, id));

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting notification:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// Create notification (for internal use)
export const createNotification = async (
  type: string,
  title: string,
  message: string,
  metadata?: any
) => {
  try {
    const result = await db
      .insert(notifications)
      .values({
        type,
        title,
        message,
        metadata,
      })
      .returning();
    return result[0];
  } catch (error: unknown) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export default notificationsRouter;
