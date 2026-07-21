import { Hono } from 'hono';
import { db } from '../db';
import { pages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyAdmin } from '../middleware/auth';
import { z } from 'zod';
import { sanitizeCmsHtml } from '../utils/sanitize-html';
import { auditLog } from '../middleware/audit';

const app = new Hono();

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  is_visible: z.boolean().default(true),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
});

// Public: Get list of visible pages
app.get('/storefront', async (c) => {
  try {
    const publicPages = await db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        updated_at: pages.updated_at,
      })
      .from(pages)
      .where(eq(pages.is_visible, true));
    return c.json({ pages: publicPages });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Public: Get page by slug
app.get('/storefront/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const [page] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.is_visible, true)));

    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page: { ...page, content: sanitizeCmsHtml(page.content) } });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Get all pages
app.get('/', verifyAdmin, async (c) => {
  try {
    const allPages = await db.select().from(pages).orderBy(pages.title);
    return c.json({
      pages: allPages.map((page) => ({
        ...page,
        content: sanitizeCmsHtml(page.content),
      })),
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Get single page
app.get('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    if (!page) return c.json({ error: 'Page not found' }, 404);
    return c.json({ page: { ...page, content: sanitizeCmsHtml(page.content) } });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Create page
app.post('/', verifyAdmin, auditLog('page', 'page.create'), async (c) => {
  try {
    const body = await c.req.json();
    const validated = pageSchema.parse(body);

    const existing = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, validated.slug));
    if (existing.length > 0)
      return c.json({ error: 'Slug already exists' }, 409);

    const [newPage] = await db
      .insert(pages)
      .values({ ...validated, content: sanitizeCmsHtml(validated.content) })
      .returning();
    return c.json({ page: newPage }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Update page
app.put('/:id', verifyAdmin, auditLog('page', 'page.update'), async (c) => {
  try {
    const id = c.req.param('id');
    const [oldValue] = await db.select().from(pages).where(eq(pages.id, id));
    c.set('auditOldValue' as never, oldValue as never);
    const body = await c.req.json();
    const validated = pageSchema.partial().parse(body);

    if (validated.slug) {
      const [existing] = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, validated.slug));
      if (existing && existing.id !== id)
        return c.json({ error: 'Slug already exists' }, 409);
    }

    const sanitized = {
      ...validated,
      ...(validated.content
        ? { content: sanitizeCmsHtml(validated.content) }
        : {}),
    };
    const [updated] = await db
      .update(pages)
      .set({ ...sanitized, updated_at: new Date() })
      .where(eq(pages.id, id))
      .returning();

    return c.json({ page: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Delete page
app.delete('/:id', verifyAdmin, auditLog('page', 'page.delete'), async (c) => {
  try {
    const id = c.req.param('id');
    const [oldValue] = await db.select().from(pages).where(eq(pages.id, id));
    c.set('auditOldValue' as never, oldValue as never);
    await db.delete(pages).where(eq(pages.id, id));
    return c.json({ message: 'Page deleted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
