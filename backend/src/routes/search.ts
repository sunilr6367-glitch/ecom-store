import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { desc, eq, sql } from 'drizzle-orm';

import { db } from '../db/client';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';
import { paginatedResponse, successResponse, HttpStatus } from '../utils/api-response';
import { search_query_logs, search_synonyms } from '../db/schema';
import { productService } from '../services/product-service';

const searchRouter = new Hono();

async function searchProducts(c: Context) {
  const query = c.req.query('q') || c.req.query('query') || '';
  const limit = Math.min(Math.max(Number(c.req.query('limit')) || 20, 1), 50);
  const offset = Math.max(Number(c.req.query('offset')) || 0, 0);

  if (!query.trim()) {
    return paginatedResponse(
      c,
      [],
      { offset, limit, total: 0 },
      'Search query is required'
    );
  }

  const results = await productService.search(query, {
    query,
    status: 'published',
    sortBy: 'relevance',
    categoryId: c.req.query('category_id') || undefined,
    tagId: c.req.query('tag_id') || undefined,
    collectionId: c.req.query('collection_id') || undefined,
    attributeCode: c.req.query('attribute_code') || undefined,
    attributeValue: c.req.query('attribute_value') || undefined,
  });

  return paginatedResponse(
    c,
    results.slice(offset, offset + limit),
    { offset, limit, total: results.length },
    'Product search results retrieved successfully'
  );
}

searchRouter.get('/', asyncHandler(searchProducts));

const SynonymSchema = z.object({
  locale: z.string().optional().default('en'),
  term: z.string().min(1),
  normalized_term: z.string().optional(),
  synonyms: z.array(z.string()).default([]),
  boost: z.number().int().min(1).max(10).optional().default(1),
  metadata: z.record(z.unknown()).optional().nullable(),
});

searchRouter.get(
  '/products',
  asyncHandler(searchProducts)
);

searchRouter.get(
  '/synonyms',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const locale = c.req.query('locale') || 'en';
    const rows = await db
      .select()
      .from(search_synonyms)
      .where(eq(search_synonyms.locale, locale))
      .orderBy(desc(search_synonyms.boost), desc(search_synonyms.updated_at));

    return successResponse(c, { synonyms: rows }, 'Search synonyms retrieved successfully');
  })
);

searchRouter.post(
  '/synonyms',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const result = SynonymSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid synonym data', result.error.errors);

    const normalized = (result.data.normalized_term || result.data.term).trim().toLowerCase();
    const [synonym] = await db
      .insert(search_synonyms)
      .values({ ...result.data, normalized_term: normalized })
      .returning();

    return successResponse(c, { synonym }, 'Search synonym created successfully', HttpStatus.CREATED);
  })
);

searchRouter.put(
  '/synonyms/:id',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = SynonymSchema.partial().safeParse(body);
    if (!result.success) throw new ValidationError('Invalid synonym data', result.error.errors);

    const normalized =
      result.data.normalized_term ||
      (result.data.term ? result.data.term.trim().toLowerCase() : undefined);

    const [synonym] = await db
      .update(search_synonyms)
      .set({ ...result.data, normalized_term: normalized, updated_at: new Date() })
      .where(eq(search_synonyms.id, id))
      .returning();

    if (!synonym) throw new NotFoundError('Search synonym not found');
    return successResponse(c, { synonym }, 'Search synonym updated successfully');
  })
);

searchRouter.delete(
  '/synonyms/:id',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const [synonym] = await db
      .delete(search_synonyms)
      .where(eq(search_synonyms.id, id))
      .returning();

    if (!synonym) throw new NotFoundError('Search synonym not found');
    return successResponse(c, { synonym }, 'Search synonym deleted successfully');
  })
);

searchRouter.get(
  '/analytics/top-queries',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const rows = await db
      .select({
        query: search_query_logs.normalized_query,
        searches: sql<number>`count(*)`,
        avg_results: sql<number>`round(avg(${search_query_logs.result_count}))`,
        last_seen: sql<Date>`max(${search_query_logs.created_at})`,
      })
      .from(search_query_logs)
      .groupBy(search_query_logs.normalized_query)
      .orderBy(sql`count(*) desc`)
      .limit(50);

    return successResponse(c, { top_queries: rows }, 'Top search queries retrieved successfully');
  })
);

searchRouter.get(
  '/analytics/attribute-gaps',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const zeroRows = await db
      .select()
      .from(search_query_logs)
      .where(eq(search_query_logs.result_count, 0))
      .orderBy(desc(search_query_logs.created_at))
      .limit(200);

    const gapRules = [
      { attribute_code: 'fabric', terms: ['cotton', 'linen', 'silk', 'mulmul', 'khadi'] },
      { attribute_code: 'technique', terms: ['block print', 'kantha', 'bagru', 'sanganeri', 'embroidered'] },
      { attribute_code: 'occasion', terms: ['wedding', 'festive', 'office', 'vacation', 'gift'] },
      { attribute_code: 'style', terms: ['boho', 'ethnic', 'kaftan', 'kurti', 'dress'] },
      { attribute_code: 'region', terms: ['jaipur', 'rajasthan', 'sanganer'] },
      { attribute_code: 'color', terms: ['blue', 'pink', 'white', 'black', 'green', 'red'] },
    ];

    const gaps = zeroRows.flatMap((row) => {
      const query = (row.normalized_query || row.query || '').toLowerCase();
      return gapRules.flatMap((rule) =>
        rule.terms
          .filter((term) => query.includes(term))
          .map((term) => ({
            query: row.query,
            implied_attribute: rule.attribute_code,
            implied_value: term,
            created_at: row.created_at,
          }))
      );
    });

    return successResponse(c, { attribute_gaps: gaps.slice(0, 100) }, 'Attribute gap report generated successfully');
  })
);

searchRouter.get(
  '/analytics/zero-results',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const rows = await db
      .select()
      .from(search_query_logs)
      .where(eq(search_query_logs.result_count, 0))
      .orderBy(desc(search_query_logs.created_at))
      .limit(100);

    return successResponse(c, { zero_results: rows }, 'Zero-result searches retrieved successfully');
  })
);

export default searchRouter;
