import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../db/client';
import { product_reviews, products } from '../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { verifyAdmin, verifyAuth } from '../middleware/auth'; // BUG-012 FIX: was verifyAuth
import { generalLimiter } from '../middleware/rate-limiter';
import { uploadImageToCloudinary } from '../utils/cloudinary';

const reviewsRouter = new Hono();

// Schemas
const CreateReviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
  author_name: z.string().min(1),
  images: z.array(z.string()).optional(),
});

const UpdateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

// GET /reviews/store/products/:id - Get approved reviews for a product (Storefront)
reviewsRouter.get('/store/products/:id', async (c) => {
  const productId = c.req.param('id');
  try {
    const reviews = await db.query.product_reviews.findMany({
      where: and(
        eq(product_reviews.product_id, productId),
        eq(product_reviews.status, 'approved')
      ),
      orderBy: desc(product_reviews.created_at),
    });
    return c.json({ reviews });
  } catch (error: unknown) {
    console.error('Error fetching reviews:', error);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// POST /reviews/store - Create a review (Storefront - Guest/Auth)
reviewsRouter.post(
  '/store',
  zValidator('json', CreateReviewSchema),
  async (c) => {
    const data = c.req.valid('json');

    try {
      // Check if product exists
      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, data.product_id))
        .limit(1);

      if (!product) {
        return c.json({ error: 'Product not found' }, 404);
      }

      const result = await db
        .insert(product_reviews)
        .values({
          ...data,
          status: 'pending', // Default to pending
        })
        .returning();

      return c.json({ review: result[0] }, 201);
    } catch (error: unknown) {
      console.error('Error creating review:', error);
      return c.json({ error: 'Failed to create review' }, 500);
    }
  }
);

// POST /reviews/upload - Upload review images (auth + rate limited)
reviewsRouter.post('/upload', generalLimiter, verifyAuth, async (c) => {
  try {
    const body = await c.req.parseBody();
    const files = body.images;

    if (!files) {
      return c.json({ error: 'No files uploaded' }, 400);
    }

    // Handle single file or multiple files
    const fileArray = Array.isArray(files) ? files : [files];

    // Validate max 5 images
    if (fileArray.length > 5) {
      return c.json({ error: 'Maximum 5 images allowed' }, 400);
    }

    const uploadedUrls: string[] = [];

    for (const file of fileArray) {
      if (!(file instanceof File)) {
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return c.json(
          {
            error: `Invalid file type: ${file.name}. Only JPEG, PNG, and WebP allowed.`,
          },
          400
        );
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return c.json(
          { error: `File too large: ${file.name}. Maximum size is 5MB.` },
          400
        );
      }

      const upload = await uploadImageToCloudinary(file, {
        folder: 'odhvica/reviews',
      });
      uploadedUrls.push(upload.secureUrl);
    }

    return c.json(
      {
        success: true,
        images: uploadedUrls,
        count: uploadedUrls.length,
      },
      201
    );
  } catch (error: unknown) {
    console.error('Error uploading review images:', error);
    return c.json({ error: 'Failed to upload images' }, 500);
  }
});

// --- ADMIN ROUTES ---

// GET /reviews - Get all reviews (Admin)
reviewsRouter.get('/', verifyAdmin, async (c) => {
  try {
    const { limit = '50', offset = '0', status } = c.req.query();
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    let query = db.query.product_reviews.findMany({
      orderBy: desc(product_reviews.created_at),
      limit: limitNum,
      offset: offsetNum,
      with: {
        product: {
          columns: {
            title: true,
            thumbnail: true,
          },
        },
      },
    });

    // Apply status filter if provided
    if (status) {
      query = db.query.product_reviews.findMany({
        where: eq(product_reviews.status, status),
        orderBy: desc(product_reviews.created_at),
        limit: limitNum,
        offset: offsetNum,
        with: {
          product: {
            columns: {
              title: true,
              thumbnail: true,
            },
          },
        },
      });
    }

    const reviews = await query;

    // BUG-018 FIX: Get total count with same filter applied
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(product_reviews);

    const countResult = status
      ? await countQuery.where(eq(product_reviews.status, status))
      : await countQuery;
    const total = countResult[0]?.count || 0;

    return c.json({
      reviews,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching reviews:', error);
    return c.json({ error: 'Failed to fetch reviews' }, 500);
  }
});

// PUT /reviews/:id/status - Update review status (Admin)
reviewsRouter.put(
  '/:id/status',
  verifyAdmin,
  zValidator('json', UpdateReviewStatusSchema),
  async (c) => {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');

    try {
      const result = await db
        .update(product_reviews)
        .set({ status })
        .where(eq(product_reviews.id, id))
        .returning();

      return c.json({ review: result[0] });
    } catch (error: unknown) {
      return c.json({ error: 'Failed to update review status' }, 500);
    }
  }
);

// DELETE /reviews/:id
reviewsRouter.delete('/:id', verifyAdmin, async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(product_reviews).where(eq(product_reviews.id, id));
    return c.json({ success: true });
  } catch (error: unknown) {
    return c.json({ error: 'Failed to delete review' }, 500);
  }
});

export default reviewsRouter;
