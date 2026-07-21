import { db } from '../db/client';
import { product_reviews, customers } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

export const CreateReviewSchema = z.object({
  product_id: z.string(),
  customer_id: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
  author_name: z.string(),
});

export const UpdateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});

class ReviewService {
  async create(data: z.infer<typeof CreateReviewSchema>) {
    const [review] = await db
      .insert(product_reviews)
      .values({
        ...data,
        status: 'pending', // Default to pending moderation
      })
      .returning();
    return review;
  }

  async getProductReviews(productId: string) {
    return await db
      .select({
        id: product_reviews.id,
        rating: product_reviews.rating,
        title: product_reviews.title,
        content: product_reviews.content,
        author_name: product_reviews.author_name,
        created_at: product_reviews.created_at,
      })
      .from(product_reviews)
      .where(
        and(
          eq(product_reviews.product_id, productId),
          eq(product_reviews.status, 'approved')
        )
      )
      .orderBy(desc(product_reviews.created_at));
  }

  async getAllReviews(limit = 50, offset = 0, status?: string) {
    let query = db
      .select({
        id: product_reviews.id,
        product_id: product_reviews.product_id,
        customer_id: product_reviews.customer_id,
        rating: product_reviews.rating,
        title: product_reviews.title,
        content: product_reviews.content,
        status: product_reviews.status,
        author_name: product_reviews.author_name,
        created_at: product_reviews.created_at,
      })
      .from(product_reviews)
      .$dynamic();

    if (status) {
      query = query.where(eq(product_reviews.status, status));
    }

    return await query
      .orderBy(desc(product_reviews.created_at))
      .limit(limit)
      .offset(offset);
  }

  async updateStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    const [review] = await db
      .update(product_reviews)
      .set({ status, updated_at: new Date() })
      .where(eq(product_reviews.id, id))
      .returning();
    return review;
  }

  async delete(id: string) {
    await db.delete(product_reviews).where(eq(product_reviews.id, id));
    return { success: true };
  }
}

export const reviewService = new ReviewService();
