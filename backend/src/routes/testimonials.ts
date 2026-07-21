import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { verifyAdmin } from '../middleware/auth';
import { db } from '../db/client';
import { testimonials } from '../db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { z } from 'zod';

const testimonialsRouter = new Hono();

const TestimonialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  avatar_url: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  content: z.string().min(1, 'Content is required'),
  is_active: z.boolean().default(true),
  display_order: z.number().default(0),
});

// Public: Get all active testimonials (for storefront)
testimonialsRouter.get('/store', async (c) => {
  try {
    const list = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.is_active, true))
      .orderBy(asc(testimonials.display_order), desc(testimonials.created_at));
    return c.json({ testimonials: list });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch testimonials' }, 500);
  }
});

// Admin: Get all testimonials
testimonialsRouter.get('/', verifyAdmin, async (c) => {
  try {
    const list = await db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.display_order), desc(testimonials.created_at));
    return c.json({ testimonials: list });
  } catch (error: any) {
    return c.json({ error: 'Failed to fetch testimonials' }, 500);
  }
});

// Admin: Get single testimonial
testimonialsRouter.get('/:id', verifyAdmin, async (c) => {
  const id = c.req.param('id');
  try {
    const testimonial = await db.query.testimonials.findFirst({
      where: eq(testimonials.id, id),
    });

    if (!testimonial) {
      return c.json({ error: 'Testimonial not found' }, 404);
    }

    return c.json({ testimonial });
  } catch (error: unknown) {
    console.error('Error fetching testimonial:', error);
    return c.json({ error: 'Failed to fetch testimonial' }, 500);
  }
});

// Admin: Create testimonial
testimonialsRouter.post(
  '/',
  verifyAdmin,
  zValidator('json', TestimonialSchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const [newTestimonial] = await db
        .insert(testimonials)
        .values({
          name: data.name,
          location: data.location,
          avatar_url: data.avatar_url,
          rating: data.rating,
          content: data.content,
          is_active: data.is_active,
          display_order: data.display_order,
        })
        .returning();

      return c.json({ testimonial: newTestimonial }, 201);
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to create testimonial' },
        500
      );
    }
  }
);

// Admin: Update testimonial
testimonialsRouter.put(
  '/:id',
  verifyAdmin,
  zValidator('json', TestimonialSchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    try {
      const [updatedTestimonial] = await db
        .update(testimonials)
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where(eq(testimonials.id, id))
        .returning();

      return c.json({ testimonial: updatedTestimonial });
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to update testimonial' },
        500
      );
    }
  }
);

// Admin: Delete testimonial
testimonialsRouter.delete('/:id', verifyAdmin, async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(testimonials).where(eq(testimonials.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to delete testimonial' },
      500
    );
  }
});

export default testimonialsRouter;
