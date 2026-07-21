import { Hono } from 'hono';
import { db } from '../db';
import { posts } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyAdmin } from '../middleware/auth';
import { z } from 'zod';

const app = new Hono();

const postSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  cover_image: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  published_at: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : null)),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
});

// Public: Get published posts
app.get('/storefront', async (c) => {
  try {
    const publishedPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, 'published'))
      .orderBy(desc(posts.published_at));
    return c.json({ posts: publishedPosts });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Public: Get single post by slug
app.get('/storefront/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.status, 'published')));

    if (!post) return c.json({ error: 'Post not found' }, 404);
    return c.json({ post });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Get all posts
app.get('/', verifyAdmin, async (c) => {
  try {
    const allPosts = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.created_at));
    return c.json({ posts: allPosts });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Get single post
app.get('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    if (!post) return c.json({ error: 'Post not found' }, 404);
    return c.json({ post });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Create post
app.post('/', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const validated = postSchema.parse(body);

    // Check availability of slug
    const existing = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, validated.slug));
    if (existing.length > 0) {
      return c.json({ error: 'Slug already exists' }, 409);
    }

    const [newPost] = await db.insert(posts).values(validated).returning();
    return c.json({ post: newPost }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Update post
app.put('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = postSchema.partial().parse(body);

    // Check availability of slug if changing
    if (validated.slug) {
      const [existing] = await db
        .select()
        .from(posts)
        .where(eq(posts.slug, validated.slug));
      if (existing && existing.id !== id) {
        return c.json({ error: 'Slug already exists' }, 409);
      }
    }

    const [updated] = await db
      .update(posts)
      .set({ ...validated, updated_at: new Date() })
      .where(eq(posts.id, id))
      .returning();

    return c.json({ post: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Admin: Delete post
app.delete('/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await db.delete(posts).where(eq(posts.id, id));
    return c.json({ message: 'Post deleted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
