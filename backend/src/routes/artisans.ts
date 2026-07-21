import { Hono } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';

import { db } from '../db/client';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';
import { successResponse, HttpStatus } from '../utils/api-response';
import { artisans, product_artisans, products } from '../db/schema';

const artisansRouter = new Hono();

const ArtisanSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  bio: z.string().optional().nullable(),
  craft_specialty: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  knows_about: z.array(z.string()).optional(),
  has_occupation: z.string().optional().nullable(),
  same_as: z.array(z.string()).optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

artisansRouter.get(
  '/',
  asyncHandler(async (c) => {
    const rows = await db
      .select()
      .from(artisans)
      .where(eq(artisans.status, 'active'))
      .orderBy(asc(artisans.name));

    return successResponse(c, { artisans: rows }, 'Artisans retrieved successfully');
  })
);

artisansRouter.get(
  '/:slug',
  asyncHandler(async (c) => {
    const slug = c.req.param('slug');
    const [artisan] = await db.select().from(artisans).where(eq(artisans.slug, slug)).limit(1);
    if (!artisan || artisan.status !== 'active') throw new NotFoundError('Artisan not found');

    const linkedProducts = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
      })
      .from(product_artisans)
      .leftJoin(products, eq(product_artisans.product_id, products.id))
      .where(eq(product_artisans.artisan_id, artisan.id))
      .limit(12);

    return successResponse(
      c,
      { artisan, products: linkedProducts.filter((row) => row.id) },
      'Artisan retrieved successfully'
    );
  })
);

artisansRouter.post(
  '/',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const result = ArtisanSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid artisan data', result.error.errors);

    const [artisan] = await db.insert(artisans).values(result.data).returning();
    return successResponse(c, { artisan }, 'Artisan created successfully', HttpStatus.CREATED);
  })
);

artisansRouter.put(
  '/:id',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = ArtisanSchema.partial().safeParse(body);
    if (!result.success) throw new ValidationError('Invalid artisan data', result.error.errors);

    const [artisan] = await db
      .update(artisans)
      .set({ ...result.data, updated_at: new Date() })
      .where(eq(artisans.id, id))
      .returning();

    if (!artisan) throw new NotFoundError('Artisan not found');
    return successResponse(c, { artisan }, 'Artisan updated successfully');
  })
);

export default artisansRouter;
