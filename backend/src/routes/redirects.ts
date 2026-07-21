import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { verifyAdmin } from '../middleware/auth';
import { db } from '../db/client';
import { redirects } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const redirectsRouter = new Hono();

const RedirectSchema = z.object({
  from_path: z.string().min(1).startsWith('/'),
  to_path: z.string().min(1).startsWith('/'),
  status: z.number().int().refine((v) => v === 301 || v === 302).default(301),
});

// GET /redirects — admin list
redirectsRouter.get('/', verifyAdmin, async (c) => {
  try {
    const list = await db.select().from(redirects).orderBy(redirects.created_at);
    return c.json({ redirects: list });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch redirects' }, 500);
  }
});

// GET /redirects/lookup?path=/collections/kantha-quilts — public (storefront middleware)
redirectsRouter.get('/lookup', async (c) => {
  const path = c.req.query('path');
  if (!path) return c.json({ redirect: null });

  try {
    const match = await db.query.redirects.findFirst({
      where: eq(redirects.from_path, path),
    });
    return c.json({
      redirect: match
        ? {
            ...match,
            status_code: match.status,
          }
        : null,
    });
  } catch {
    return c.json({ redirect: null });
  }
});

// POST /redirects
redirectsRouter.post(
  '/',
  verifyAdmin,
  zValidator('json', RedirectSchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const [created] = await db.insert(redirects).values(data).returning();
      return c.json({ redirect: created }, 201);
    } catch (error: any) {
      if (error.message?.includes('unique')) {
        return c.json({ error: 'Redirect for this path already exists' }, 409);
      }
      return c.json({ error: 'Failed to create redirect' }, 500);
    }
  }
);

// DELETE /redirects/:id
redirectsRouter.delete('/:id', verifyAdmin, async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(redirects).where(eq(redirects.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete redirect' }, 500);
  }
});

export default redirectsRouter;
